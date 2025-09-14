import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// ✅ Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Gmail credentials (from environment or functions:config)
const gmailUser = process.env.EMAIL_USER || functions.config().email.user;
const gmailPass = process.env.EMAIL_PASS || functions.config().email.pass;

// ✅ Nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

export const sendSuperAdminInvite = functions.https.onCall(async (data, context) => {
  const {email, packageId, signupUrl, token} = data;

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }


  // ✅ Save token in Firestore
  await admin.firestore().collection("superadminInvites").doc(email).set({
    email,
    packageId,
    token: token,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    used: false,
  });

  // ✅ Build email
  const mailOptions = {
    from: `DriveSphere <${gmailUser}>`,
    to: email,
    subject: "You're invited to join DriveSphere 🚛",
    html: `
      <p>Hello,</p>
      <p>You’ve accepted the <b>${packageId}</b> package. Click the link below to complete your signup:</p>
      <a href="${signupUrl}" target="_blank">${signupUrl}</a>
      <p>This link is valid for one-time signup.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true, message: `Invite sent to ${email}`};
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Email failed to send");
  }
});
