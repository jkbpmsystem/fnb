const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// =====================
// GMAIL CONFIG
// Set these with: firebase functions:config:set gmail.email="you@gmail.com" gmail.password="your-app-password"
// =====================
const gmailEmail = functions.config().gmail?.email || "";
const gmailPassword = functions.config().gmail?.password || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// =====================
// HELPER: Get ordinal label (1st, 2nd, 3rd...)
// =====================
function getOrdinal(i) {
  if (i === 1) return "1st";
  if (i === 2) return "2nd";
  if (i === 3) return "3rd";
  return i + "th";
}

// =====================
// HELPER: Parse date safely
// =====================
function parseDate(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

// =====================
// HELPER: Format date DD/MM/YYYY
// =====================
function formatDate(d) {
  if (!d) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  return day + "/" + mon + "/" + d.getFullYear();
}

// =====================
// SCAN ASSETS FOR UPCOMING PPM
// =====================
async function scanModule(moduleKey) {
  const snap = await db.collection("modules").doc(moduleKey).collection("assets").get();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alerts30 = [];
  const alerts14 = [];

  snap.docs.forEach((doc) => {
    const asset = doc.data();
    const assetId = doc.id;
    const name = asset.equipmentName || asset.assetDescription || "-";
    const location = asset.codeLocation || asset.locationCode || asset.location || "-";
    const vendor = asset.supplier || asset.vendor || "-";

    // --- DURING WARRANTY PPM (1st, 2nd, ..., 21st) ---
    for (let i = 1; i <= 21; i++) {
      const ord = getOrdinal(i);
      const planned = parseDate(asset[ord]);
      const done = asset["done_" + ord];
      if (!planned || done) continue;

      const diff = Math.ceil((planned - today) / (1000 * 60 * 60 * 24));

      if (diff === 30 || diff === 29) {
        alerts30.push({
          type: "During Warranty",
          module: moduleKey.toUpperCase(),
          id: assetId,
          name: name,
          location: location,
          vendor: vendor,
          cycle: ord,
          dueDate: planned,
          daysLeft: diff,
        });
      }

      if (diff === 14 || diff === 13) {
        alerts14.push({
          type: "During Warranty",
          module: moduleKey.toUpperCase(),
          id: assetId,
          name: name,
          location: location,
          vendor: vendor,
          cycle: ord,
          dueDate: planned,
          daysLeft: diff,
        });
      }
    }

    // --- POST WARRANTY PPM (post_1st, post_2nd, ...) ---
    for (let i = 1; i <= 21; i++) {
      const ord = getOrdinal(i);
      const planned = parseDate(asset["post_" + ord]);
      const done = asset["done_post_" + ord];
      if (!planned || done) continue;

      const diff = Math.ceil((planned - today) / (1000 * 60 * 60 * 24));

      if (diff === 30 || diff === 29) {
        alerts30.push({
          type: "Post Warranty",
          module: moduleKey.toUpperCase(),
          id: assetId,
          name: name,
          location: location,
          vendor: vendor,
          cycle: "Post-" + ord,
          dueDate: planned,
          daysLeft: diff,
        });
      }

      if (diff === 14 || diff === 13) {
        alerts14.push({
          type: "Post Warranty",
          module: moduleKey.toUpperCase(),
          id: assetId,
          name: name,
          location: location,
          vendor: vendor,
          cycle: "Post-" + ord,
          dueDate: planned,
          daysLeft: diff,
        });
      }
    }
  });

  return { alerts30, alerts14 };
}

// =====================
// BUILD EMAIL HTML
// =====================
function buildEmailHTML(alerts30, alerts14) {
  let html = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#00c8ff;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:18px;">JKB — PPM Notification</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Hospital Sultan Zainal Abidin - UniSZA</p>
    </div>
    <div style="padding:20px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
  `;

  if (alerts14.length > 0) {
    html += `
      <h3 style="color:#dc2626;margin:0 0 12px;">&#9888; PPM dalam 2 MINGGU (${alerts14.length} item)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#fef2f2;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Type</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Module</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">ID</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Equipment</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Location</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Cycle</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Due Date</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Days</th>
          </tr>
        </thead>
        <tbody>
    `;
    alerts14.forEach((a) => {
      html += `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.type}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.module}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.id}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.name}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.location}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.cycle}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(a.dueDate)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">${a.daysLeft}</td>
          </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  if (alerts30.length > 0) {
    html += `
      <h3 style="color:#f59e0b;margin:0 0 12px;">&#9888; PPM dalam 30 HARI (${alerts30.length} item)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#fffbeb;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Type</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Module</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">ID</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Equipment</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Location</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Cycle</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Due Date</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Days</th>
          </tr>
        </thead>
        <tbody>
    `;
    alerts30.forEach((a) => {
      html += `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.type}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.module}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.id}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.name}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.location}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${a.cycle}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(a.dueDate)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;color:#f59e0b;font-weight:bold;">${a.daysLeft}</td>
          </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  if (alerts30.length === 0 && alerts14.length === 0) {
    html += `<p style="color:#16a34a;font-size:14px;">&#10003; Tiada PPM yang upcoming dalam 30 hari. Semua OK!</p>`;
  }

  html += `
      <p style="font-size:12px;color:#9ca3af;margin-top:20px;">
        Email ini dijana secara automatik oleh JKB Preventive Maintenance System.<br>
        Sila login ke sistem untuk update status PPM.
      </p>
    </div>
  </div>
  `;

  return html;
}

// =====================
// GET ALL ADMIN EMAILS
// =====================
async function getAdminEmails() {
  const snap = await db.collection("users").where("role", "==", "admin").get();
  const emails = [];
  snap.docs.forEach((doc) => {
    const email = doc.data().email;
    if (email) emails.push(email);
  });
  return emails;
}

// =====================
// MAIN SCHEDULED FUNCTION
// Runs daily at 8:00 AM Malaysia Time (UTC+8 = 0:00 UTC)
// =====================
exports.dailyPPMNotification = functions
  .region("asia-southeast1")
  .pubsub.schedule("0 8 * * *")
  .timeZone("Asia/Kuala_Lumpur")
  .onRun(async (context) => {
    console.log("PPM Notification scan started...");

    try {
      // Scan both modules
      const fems = await scanModule("fems");
      const bems = await scanModule("bems");

      const allAlerts30 = [...fems.alerts30, ...bems.alerts30];
      const allAlerts14 = [...fems.alerts14, ...bems.alerts14];

      console.log("30-day alerts:", allAlerts30.length);
      console.log("14-day alerts:", allAlerts14.length);

      // Skip email if nothing to report
      if (allAlerts30.length === 0 && allAlerts14.length === 0) {
        console.log("No upcoming PPM. No email sent.");
        return null;
      }

      // Get admin emails
      const adminEmails = await getAdminEmails();
      if (adminEmails.length === 0) {
        console.log("No admin emails found.");
        return null;
      }

      // Build and send email
      const html = buildEmailHTML(allAlerts30, allAlerts14);
      const totalAlerts = allAlerts30.length + allAlerts14.length;

      const mailOptions = {
        from: '"JKB PPM System" <' + gmailEmail + ">",
        to: adminEmails.join(", "),
        subject: "[JKB] PPM Notification — " + totalAlerts + " item memerlukan perhatian",
        html: html,
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent to:", adminEmails.join(", "));

      // Log to Firestore
      await db.collection("notification_logs").add({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        recipients: adminEmails,
        alerts30: allAlerts30.length,
        alerts14: allAlerts14.length,
        status: "sent",
      });

      return null;
    } catch (err) {
      console.error("PPM Notification error:", err);

      await db.collection("notification_logs").add({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        error: err.message,
        status: "failed",
      });

      return null;
    }
  });

// =====================
// HTTP TRIGGER (for manual testing)
// Call: https://asia-southeast1-YOUR_PROJECT.cloudfunctions.net/testPPMNotification
// =====================
exports.testPPMNotification = functions
  .region("asia-southeast1")
  .https.onRequest(async (req, res) => {
    try {
      const fems = await scanModule("fems");
      const bems = await scanModule("bems");

      const allAlerts30 = [...fems.alerts30, ...bems.alerts30];
      const allAlerts14 = [...fems.alerts14, ...bems.alerts14];

      const adminEmails = await getAdminEmails();

      if (allAlerts30.length === 0 && allAlerts14.length === 0) {
        res.json({
          status: "ok",
          message: "No upcoming PPM",
          adminEmails: adminEmails,
        });
        return;
      }

      const html = buildEmailHTML(allAlerts30, allAlerts14);

      if (req.query.send === "true" && adminEmails.length > 0) {
        await transporter.sendMail({
          from: '"JKB PPM System" <' + gmailEmail + ">",
          to: adminEmails.join(", "),
          subject: "[JKB TEST] PPM Notification — " + (allAlerts30.length + allAlerts14.length) + " item",
          html: html,
        });

        res.json({
          status: "sent",
          to: adminEmails,
          alerts30: allAlerts30.length,
          alerts14: allAlerts14.length,
        });
      } else {
        res.json({
          status: "preview",
          alerts30: allAlerts30.length,
          alerts14: allAlerts14.length,
          adminEmails: adminEmails,
          items30: allAlerts30.slice(0, 5),
          items14: allAlerts14.slice(0, 5),
        });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
