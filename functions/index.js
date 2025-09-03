

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const gmailUser = functions.config().email.user;
const gmailPass = functions.config().email.pass;

// Nodemailer transport using Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: gmailUser,
        pass: gmailPass,
    },
});

// 🔥 Callable function from React
exports.sendInviteEmail = functions.https.onCall(async (data, context) => {
    const { email, companyName, inviteLink, customMessage } = data;

    const mailOptions = {
        from: `"FleetPro" <${gmailUser}>`,
        to: email,
        subject: `You’ve been invited to FleetPro 🚛`,
        html: `
          <p>Hello, ${companyName}</p>
          <p>${customMessage || "You are invited to join FleetPro!"}</p>
          <p>
            <a href="${inviteLink}" style="padding:10px 15px;background:#1976d2;color:#fff;text-decoration:none;border-radius:5px;">
              Accept Invitation
            </a>
          </p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent to:", email);
        return { success: true };
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return { success: false, error: error.message };
    }
});
