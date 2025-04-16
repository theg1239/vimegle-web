import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { room, socketId, sessionId, messages } = body;

    if (!room || !socketId || !sessionId || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const messageContent = messages
      .map((msg: any) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const sender = msg.isSelf ? 'You' : 'Stranger';
        return `[${timestamp}] ${sender}: ${msg.text}\n${
          msg.replyTo
            ? ` ↳ Reply to: [${msg.replyTo.id}] ${msg.replyTo.text}`
            : ''
        }`;
      })
      .join('\n\n');

    const emailBody = `
      <h2>New Chat Report</h2>
      <p><strong>Room:</strong> ${room}</p>
      <p><strong>Socket ID:</strong> ${socketId}</p>
      <p><strong>Session ID:</strong> ${sessionId}</p>
      <h3>Chat Transcript:</h3>
      <pre>${messageContent}</pre>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'privacy@vimegle.com',
      to: process.env.REPORT_RECIPIENT,
      subject: `New Chat Report - Room ${room}`,
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Report sent.' });
  } catch (error) {
    console.error('Error handling report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
