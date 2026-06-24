/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import http from "http";
import path from "path";
import { readFileSync } from "fs";
import { join } from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { QueueState, QueueAction, ClientMessage, ServerMessage, Patient } from "./src/types";

// Initialize Firebase using applet runtime config config
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";

const firebaseConfigPath = join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig;

if (process.env.FIREBASE_CONFIG) {
  // Cloud deployment: Read config from environment variable
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (err) {
    console.error("Critical: FIREBASE_CONFIG environment variable is not valid JSON.", err);
    process.exit(1);
  }
} else {
  // Local dev: Read config from JSON file
  try {
    firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, "utf8"));
  } catch (err) {
    console.error("Critical: Could not read firebase-applet-config.json file. In production, ensure the FIREBASE_CONFIG environment variable is set:", err);
    process.exit(1);
  }
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// 3. Error handler mapping requested by Firestore security guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // Run at level authorization on Node server
    operationType,
    path
  };
  console.error('[Firestore Operations Breakdown]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// In-memory cache variables mapping the reactive Firestore stream
let patientsList: Patient[] = [];
let configData = { averageConsultTime: 12, nextTokenNumber: 6 };

let state: QueueState = {
  patients: [],
  averageConsultTime: 12,
  nextTokenNumber: 6
};

// Callback to bridge state updates with WebSocket server broadcasting
let triggerBroadcastCallback: () => void = () => {};

function rebuildAndPublishState() {
  const sortedPatients = [...patientsList].sort((a, b) => a.token - b.token);
  state = {
    patients: sortedPatients,
    averageConsultTime: configData.averageConsultTime,
    nextTokenNumber: configData.nextTokenNumber
  };
  triggerBroadcastCallback();
}

// Seeding engine to make sure first-boot has premium demo data to evaluate
async function seedDatabaseIfEmpty() {
  try {
    const configRef = doc(db, 'queueConfig', 'global');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.log("[Firestore Seeder] State config not found in cloud. Generating clinic defaults...");
      
      // Save config base
      await setDoc(configRef, {
        averageConsultTime: 12,
        nextTokenNumber: 6
      });

      const initialPatients: Patient[] = [
        { id: '1', token: 1, name: 'Ananya Rao', addedAt: Date.now() - 35 * 60000, status: 'seen', calledAt: Date.now() - 35 * 60000, completedAt: Date.now() - 20 * 60000 },
        { id: '2', token: 2, name: 'Dr. Vivek Mehta', addedAt: Date.now() - 15 * 60000, status: 'current', calledAt: Date.now() - 5 * 60000 },
        { id: '3', token: 3, name: 'Vikram Seth', addedAt: Date.now() - 10 * 60000, status: 'waiting' },
        { id: '4', token: 4, name: 'Suhail Khan', addedAt: Date.now() - 5 * 60000, status: 'waiting' },
        { id: '5', token: 5, name: 'Aditi Nair', addedAt: Date.now() - 2 * 60000, status: 'waiting' },
      ];

      for (const p of initialPatients) {
        await setDoc(doc(db, 'patients', p.id), p);
      }
      console.log("[Firestore Seeder] Default database records written successfully.");
    }
  } catch (err) {
    console.error("[Firestore Seeder] Error seeding default records:", err);
  }
}

// Subscribe real-time snapshot streams across collections
function setupFirestoreListeners() {
  console.log("[Firestore Sync] Registering active onSnapshot listeners...");

  onSnapshot(collection(db, 'patients'), (snapshot) => {
    patientsList = snapshot.docs.map(doc => doc.data() as Patient);
    rebuildAndPublishState();
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'patients');
  });

  onSnapshot(doc(db, 'queueConfig', 'global'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      configData.averageConsultTime = data.averageConsultTime ?? 12;
      configData.nextTokenNumber = data.nextTokenNumber ?? 6;
    }
    rebuildAndPublishState();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'queueConfig/global');
  });
}

// Command Actions Router
async function handleAction(action: QueueAction) {
  try {
    switch (action.type) {
      case 'ADD_PATIENT': {
        const nextToken = configData.nextTokenNumber;
        const name = action.name.trim() || `Patient #${nextToken}`;
        const patientId = Math.random().toString(36).substring(2, 9);
        const newPatient: Patient = {
          id: patientId,
          token: nextToken,
          name: name,
          addedAt: Date.now(),
          status: 'waiting',
          isEmergency: !!action.isEmergency
        };

        // Persist patient registration to Firestore
        await setDoc(doc(db, 'patients', patientId), newPatient);
        
        // Advance token counter
        await setDoc(doc(db, 'queueConfig', 'global'), {
          averageConsultTime: configData.averageConsultTime,
          nextTokenNumber: nextToken + 1
        });
        break;
      }

      case 'CALL_NEXT': {
        const activePatients = patientsList.filter(p => p.status !== 'cancelled');
        const currentPatient = activePatients.find(p => p.status === 'current');
        
        // Prioritize emergency waiting patients first, then standard chronological order
        const nextWaiting = activePatients
          .filter(p => p.status === 'waiting')
          .sort((a, b) => {
            const aEmerg = !!a.isEmergency;
            const bEmerg = !!b.isEmergency;
            if (aEmerg && !bEmerg) return -1;
            if (!aEmerg && bEmerg) return 1;
            return a.token - b.token;
          })[0];

        // Record visit completed timings for the seen patient
        if (currentPatient) {
          await setDoc(doc(db, 'patients', currentPatient.id), {
            ...currentPatient,
            status: 'seen',
            completedAt: Date.now()
          });
        }

        // Record visit called timings for the next waiting patient
        if (nextWaiting) {
          await setDoc(doc(db, 'patients', nextWaiting.id), {
            ...nextWaiting,
            status: 'current',
            calledAt: Date.now()
          });
        }
        break;
      }

      case 'UPDATE_CONSULT_TIME': {
        await setDoc(doc(db, 'queueConfig', 'global'), {
          averageConsultTime: action.mins,
          nextTokenNumber: configData.nextTokenNumber
        });
        break;
      }

      case 'CANCEL_PATIENT': {
        const p = patientsList.find(x => x.id === action.id);
        if (p) {
          await setDoc(doc(db, 'patients', p.id), {
            ...p,
            status: 'cancelled',
            cancelledAt: Date.now()
          });
        }
        break;
      }

      case 'TOGGLE_EMERGENCY': {
        const p = patientsList.find(x => x.id === action.id);
        if (p) {
          await setDoc(doc(db, 'patients', p.id), {
            ...p,
            isEmergency: !p.isEmergency
          });
        }
        break;
      }

      case 'COMPLETE_PATIENT': {
        const p = patientsList.find(x => x.id === action.id);
        if (p) {
          const wasCurrent = p.status === 'current';
          await setDoc(doc(db, 'patients', p.id), {
            ...p,
            status: 'seen',
            completedAt: Date.now()
          });

          if (wasCurrent) {
            // Find next waiting patient to auto-call
            const activePatients = patientsList.filter(x => x.status !== 'cancelled' && x.id !== p.id);
            const nextWaiting = activePatients
              .filter(x => x.status === 'waiting')
              .sort((a, b) => {
                const aEmerg = !!a.isEmergency;
                const bEmerg = !!b.isEmergency;
                if (aEmerg && !bEmerg) return -1;
                if (!aEmerg && bEmerg) return 1;
                return a.token - b.token;
              })[0];

            if (nextWaiting) {
              await setDoc(doc(db, 'patients', nextWaiting.id), {
                ...nextWaiting,
                status: 'current',
                calledAt: Date.now()
              });
            }
          }
        }
        break;
      }

      case 'CLEAR_COMPLETED': {
        const snaps = await getDocs(collection(db, 'patients'));
        for (const docSnap of snaps.docs) {
          const patientData = docSnap.data() as Patient;
          if (patientData.status === 'seen') {
            await deleteDoc(docSnap.ref);
          }
        }
        break;
      }

      case 'RESET_QUEUE': {
        // Reset operational configurations
        await setDoc(doc(db, 'queueConfig', 'global'), {
          averageConsultTime: 10,
          nextTokenNumber: 1
        });

        // Delete all patient list documents from database
        const snaps = await getDocs(collection(db, 'patients'));
        for (const docSnap of snaps.docs) {
          await deleteDoc(docSnap.ref);
        }
        break;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'action-trigger');
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // REST API Endpoints as a highly resilient fallback bridge
  app.get("/api/state", (_req, res) => {
    res.json(state);
  });

  // Long-term patient auditable timeline intelligence api
  app.get("/api/audit-report", async (_req, res) => {
    try {
      const snaps = await getDocs(collection(db, 'patients'));
      const auditPatients = snaps.docs.map(doc => doc.data() as Patient);
      // Sort patients chronological flow
      auditPatients.sort((a, b) => a.token - b.token);
      res.json({ patients: auditPatients });
    } catch (err) {
      console.error("[Clinical Audit API] Error assembling historical timeline:", err);
      res.status(500).json({ error: "Failed to assemble clinical audit report database rows" });
    }
  });

  app.post("/api/action", async (req, res) => {
    const action: QueueAction = req.body;
    if (action) {
      await handleAction(action);
      res.json({ success: true, state });
    } else {
      res.status(400).json({ error: "Missing or invalid action payload" });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcastState() {
    const msg: ServerMessage = { type: 'STATE_UPDATE', state };
    const payload = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Hook broadcast triggers with Firestore snapshot releases
  triggerBroadcastCallback = broadcastState;

  wss.on("connection", (ws) => {
    // Send initial status immediately on connection
    const initMsg: ServerMessage = { type: 'STATE_INIT', state };
    ws.send(JSON.stringify(initMsg));

    ws.on("message", async (data) => {
      try {
        const rawMsg = data.toString();
        const clientMsg: ClientMessage = JSON.parse(rawMsg);

        if (clientMsg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', ts: clientMsg.ts }));
        } else if (clientMsg.type === 'ACTION') {
          await handleAction(clientMsg.action);
        }
      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    });
  });

  // Serve static assets or use Vite's development HMR/Middlewares
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Clinic Server] Running on http://localhost:${PORT}`);
    
    // Seed and synchronize database in the background after binding to the port
    seedDatabaseIfEmpty()
      .then(() => {
        console.log("[Clinic Server] Seeding checking complete. Starting live Firestore listeners...");
        setupFirestoreListeners();

        // Start automatic calling system based on Doctor Pace Control (averageConsultTime)
        console.log("[Clinic Server] Engaging auto-call checks every 5 seconds...");
        setInterval(async () => {
          try {
            const activePatients = patientsList.filter(p => p.status !== 'cancelled');
            const currentPatient = activePatients.find(p => p.status === 'current');
            if (currentPatient && currentPatient.calledAt) {
              const timeElapsedMs = Date.now() - currentPatient.calledAt;
              const targetMs = configData.averageConsultTime * 60 * 1000;
              if (timeElapsedMs >= targetMs) {
                console.log(`[Auto-Call] Consultation time of ${configData.averageConsultTime}m exceeded for T-${currentPatient.token}. Calling next...`);
                await handleAction({ type: 'CALL_NEXT' });
              }
            }
          } catch (err) {
            console.error("Error in auto-call check interval:", err);
          }
        }, 5000);
      })
      .catch((err) => {
        console.error("[Clinic Server] Background database initialization failed:", err);
      });
  });
}

startServer();
