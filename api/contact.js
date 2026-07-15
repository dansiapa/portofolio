const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Create transporter using environment variables
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Send email
        await transporter.sendMail({
            from: `"Portfolio Website" <${process.env.SMTP_USER}>`,
            to: process.env.RECEIVE_EMAIL,
            replyTo: email,
            subject: `New Contact from Portfolio: ${name}`,
            html: `
                <h2>New message from your portfolio website</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email send error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
}
