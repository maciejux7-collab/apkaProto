import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { db } from "./src/db/index.ts";
import { technicians, branches, accessTokens, protocols, additionalTasks } from "./src/db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // --- SQL API ENDPOINTS ---

  // Technicians
  app.get("/api/technicians", async (req, res) => {
    try {
      const allTechs = await db.select().from(technicians);
      res.json(allTechs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const [newTech] = await db.insert(technicians).values(req.body).returning();
      res.json(newTech);
    } catch (err) {
      res.status(500).json({ error: "Failed to create technician" });
    }
  });

  app.patch("/api/technicians/:id", async (req, res) => {
    try {
      const [updatedTech] = await db
        .update(technicians)
        .set(req.body)
        .where(eq(technicians.id, req.params.id as any))
        .returning();
      res.json(updatedTech);
    } catch (err) {
      res.status(500).json({ error: "Failed to update technician" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      await db.delete(technicians).where(eq(technicians.id, req.params.id as any));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete technician" });
    }
  });

  // Branches
  app.get("/api/branches", async (req, res) => {
    try {
      const allBranches = await db.select().from(branches);
      res.json(allBranches);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const [newBranch] = await db.insert(branches).values(req.body).returning();
      res.json(newBranch);
    } catch (err) {
      res.status(500).json({ error: "Failed to create branch" });
    }
  });

  app.patch("/api/branches/:id", async (req, res) => {
    try {
      const [updatedBranch] = await db
        .update(branches)
        .set(req.body)
        .where(eq(branches.id, req.params.id as any))
        .returning();
      res.json(updatedBranch);
    } catch (err) {
      res.status(500).json({ error: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", async (req, res) => {
    try {
      await db.delete(branches).where(eq(branches.id, req.params.id as any));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete branch" });
    }
  });

  // Access Tokens
  app.get("/api/access-tokens/:token", async (req, res) => {
    try {
      const [tokenData] = await db
        .select()
        .from(accessTokens)
        .where(and(eq(accessTokens.token, req.params.token), eq(accessTokens.used, false)))
        .limit(1);
      
      if (!tokenData) {
        return res.status(404).json({ error: "Token not found or already used" });
      }
      res.json(tokenData);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch token" });
    }
  });

  app.post("/api/access-tokens", async (req, res) => {
    try {
      const [newToken] = await db.insert(accessTokens).values(req.body).returning();
      res.json(newToken);
    } catch (err) {
      res.status(500).json({ error: "Failed to create access token" });
    }
  });

  app.patch("/api/access-tokens/:token", async (req, res) => {
    try {
      const [updatedToken] = await db
        .update(accessTokens)
        .set({ used: true })
        .where(eq(accessTokens.token, req.params.token))
        .returning();
      res.json(updatedToken);
    } catch (err) {
      res.status(500).json({ error: "Failed to update token" });
    }
  });

  // Protocols
  app.get("/api/protocols", async (req, res) => {
    try {
      const allProtocols = await db.select().from(protocols).orderBy(desc(protocols.createdAt));
      res.json(allProtocols);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch protocols" });
    }
  });

  app.post("/api/protocols", async (req, res) => {
    try {
      const { data, branchNumber } = req.body;
      const [newProtocol] = await db.insert(protocols).values({
        data,
        branchNumber
      }).returning();

      // Update branch last maintenance date
      if (branchNumber) {
        await db.update(branches)
          .set({ lastMaintenanceDate: new Date() })
          .where(eq(branches.branchNumber, branchNumber));
      }

      res.json(newProtocol);
    } catch (err) {
      res.status(500).json({ error: "Failed to create protocol" });
    }
  });

  // Additional Tasks
  app.get("/api/additional-tasks", async (req, res) => {
    try {
      const tasks = await db.select().from(additionalTasks).orderBy(desc(additionalTasks.createdAt));
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch additional tasks" });
    }
  });

  app.post("/api/additional-tasks", async (req, res) => {
    try {
      const [newTask] = await db.insert(additionalTasks).values(req.body).returning();
      res.json(newTask);
    } catch (err) {
      res.status(500).json({ error: "Failed to create additional task" });
    }
  });

  app.delete("/api/additional-tasks/:id", async (req, res) => {
    try {
      await db.delete(additionalTasks).where(eq(additionalTasks.id, req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // --- EXISTING EMAIL LOGIC ---

  // API Route: Send Email
  app.post("/api/send-email", async (req, res) => {
    try {
      const { protocol, xlsAttachment, pdfAttachment } = req.body;
      if (!protocol) {
        return res.status(400).json({ success: false, error: "Brak danych protokołu" });
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser || '"Serwis SSWiN/SKD" <no-reply@protokol-konserwacji.pl>';
      
      const recipients = ["artur236@poczta.onet.pl", "adrozdz94@gmail.com"];

      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.json({
          success: true,
          message: "Protokół został pomyślnie przetworzony! (Tryb testowy: e-mail nie został wysłany - brak konfiguracji SMTP).",
          sentTo: recipients.join(", "),
          smtpConfigured: false,
          timestamp: new Date().toISOString()
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const branchInfo = `${protocol.branch?.branchNumber || ''} - ${protocol.branch?.city || ''}`;
      const subject = `Protokół konserwacji SSWiN/SKD - Oddział ${branchInfo}`;
      
      const bodyText = `Dzień dobry,
W załączniku przesyłamy protokół konserwacji systemów bezpieczeństwa dla oddziału ${branchInfo}.
Wiadomość wygenerowana automatycznie.`;

      const attachments = [];
      if (pdfAttachment) {
        attachments.push({
          filename: `Protokol_Konserwacji_${protocol.branch?.branchNumber || 'oddzial'}.pdf`,
          content: Buffer.from(pdfAttachment, 'base64'),
          contentType: 'application/pdf'
        });
      }
      if (xlsAttachment) {
        attachments.push({
          filename: `Protokol_Konserwacji_${protocol.branch?.branchNumber || 'oddzial'}.xlsx`,
          content: Buffer.from(xlsAttachment, 'base64'),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      await transporter.sendMail({
        from: smtpFrom,
        to: recipients.join(", "),
        subject: subject,
        text: bodyText,
        attachments: attachments
      });

      return res.json({ success: true, message: "E-mail wysłany!", smtpConfigured: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Send Access Link
  app.post("/api/send-access-link", async (req, res) => {
    try {
      const { technicianEmail, technicianName, branchName, accessLink } = req.body;
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser || '"Serwis SSWiN/SKD" <no-reply@protokol-konserwacji.pl>';

      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.json({ success: true, message: "Link wygenerowany pomyślnie! (Tryb testowy).", accessLink });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: technicianEmail,
        subject: `Dostęp do protokołu konserwacji - ${branchName}`,
        text: `Dzień dobry ${technicianName},\n\nZostało Ci przydzielone zadanie konserwacji w oddziale: ${branchName}.\n\nLink: ${accessLink}\n\nLink wygaśnie po wypełnieniu protokołu.`,
      });

      return res.json({ success: true, message: `Link został wysłany na adres: ${technicianEmail}` });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

