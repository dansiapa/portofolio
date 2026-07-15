const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load email config
const emailConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'email-config.json'), 'utf8'));

// Nodemailer transporter - using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_pass // Use App Password, NOT your regular Gmail password
    }
});

const server = http.createServer((req, res) => {
    // Handle contact form submission
    if (req.method === 'POST' && req.url === '/api/contact') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { name, email, message } = data;

                // Validate input
                if (!name || !email || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'All fields are required' }));
                    return;
                }

                // Send email
                await transporter.sendMail({
                    from: `"Portfolio Website" <${emailConfig.smtp_user}>`,
                    to: emailConfig.receive_email,
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

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Email sent successfully' }));
            } catch (error) {
                console.error('Email send error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Failed to send email. Please try again later.' }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
    const contentType = mimeTypes[ext] || 'text/html';

    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(3000, () => { console.log('Server running at http://localhost:3000'); });


