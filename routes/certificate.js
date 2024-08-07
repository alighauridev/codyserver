const express = require("express");
const puppeteer = require("puppeteer");
const User = require("../models/userModel");
const Certificate = require("../models/certificate");
const router = express.Router();
const puppeteerLaunchOptions = {
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu",
  ],
  timeout: 120000,
};
router.post("/generate", async (req, res) => {
  try {
    const { userName, courseName, courseDuration, userId, courseId } = req.body;

    const existingCertificate = await Certificate.findOne({ userId, courseId });

    if (existingCertificate) {
      return res.status(200).send("Certificate already exists");
    }

    const certificateNumber = "UC-" + Math.random().toString(36).substr(2, 9);
    const referenceNumber = Math.floor(1000 + Math.random() * 9000).toString();

    const certificate = new Certificate({
      userId,
      userName,
      courseName,
      courseDuration,
      certificateNumber,
      referenceNumber,
      courseId,
    });

    await certificate.save();

    res.status(201).send(certificate);
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
});

// Get all certificates
router.get("/", async (req, res) => {
  try {
    const certificates = await Certificate.find();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific certificate
router.get("/:id", async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (certificate == null) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) {
      return res.status(404).send(`User not found`);
    }
    const certificates = await Certificate.find({ id: req.params.userId });

    if (!certificates) {
      return res
        .status(404)
        .send(`No certificates found for user with id ${req.params.userId}`);
    }
    res.send(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching certificate");
  }
});

router.get("/", async (req, res) => {
  const { name, course, date, duration } = req.query;

  const certificateHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Certificate of Completion</title>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Open Sans', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .certificate {
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 40px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #335EF6;
                    font-family: 'Montserrat', sans-serif;
                }
                .logo img {
                    height: 50px;
                    width: auto;
                }
                .certificate-info {
                    font-size: 10px;
                    text-align: right;
                    color: #6a6f73;
                }
                .title {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                    color: #335EF6;
                    font-family: 'Montserrat', sans-serif;
                }
                .course-title {
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Montserrat', sans-serif;
                    color: #335EF6;
                }
                .instructors {
                    font-size: 18px;
                    margin-bottom: 40px;
                    color: #6a6f73;
                }
                .student-name {
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Montserrat', sans-serif;
                }
                .completion-info {
                    font-size: 18px;
                    color: #6a6f73;
                }
                .download-buttons {
                    text-align: center;
                    margin-top: 20px;
                }
                .download-button {
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 0 10px;
                    background-color: #335EF6;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="header">
                    <div class="logo">
                        <img src="/images/logohotizantal.png" alt="Your Logo">
                    </div>
                    <div class="certificate-info">
                        Certificate no: UC-${Math.random().toString(36).substr(2, 9)}<br>
                        Certificate url: ude.my/UC-${Math.random().toString(36).substr(2, 9)}<br>
                        Reference Number: ${Math.floor(1000 + Math.random() * 9000)}
                    </div>
                </div>
                
                <div class="title">Certificate of Completion</div>
                
                <div class="course-title">
                    ${course}
                </div>
                
                <div class="instructors">
                    Instructors: Your App Instructors
                </div>
                
                <div class="student-name">
                    ${name}
                </div>
                
                <div class="completion-info">
                    Date ${date}<br>
                    Length ${duration}
                </div>
            </div>
            <div class="download-buttons">
                <a href="/certificate/download-pdf?name=${encodeURIComponent(name)}&course=${encodeURIComponent(course)}&date=${encodeURIComponent(date)}&duration=${encodeURIComponent(duration)}" class="download-button">Download PDF</a>
                <a href="/certificate/download-jpg?name=${encodeURIComponent(name)}&course=${encodeURIComponent(course)}&date=${encodeURIComponent(date)}&duration=${encodeURIComponent(duration)}" class="download-button">Download JPG</a>
            </div>
        </body>
        </html>
    `;

  res.send(certificateHtml);
});

router.get("/download-pdf", async (req, res) => {
  const { name, course, date, duration } = req.query;
  let browser;
  try {
    browser = await puppeteer.launch(puppeteerLaunchOptions);
    const page = await browser.newPage();

    await page.setContent(
      generateCertificateHtml(name, course, date, duration)
    );

    const element = await page.$("#certificate");
    const boundingBox = await element.boundingBox();

    // Set the page size to match the certificate size
    await page.setViewport({
      width: Math.ceil(boundingBox.width),
      height: Math.ceil(boundingBox.height),
      deviceScaleFactor: 1,
    });

    const pdf = await page.pdf({
      width: Math.ceil(boundingBox.width + 50),
      height: Math.ceil(boundingBox.height + 50),
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(name)}_certificate.pdf`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  } finally {
    if (browser) await browser.close();
  }
});

router.get("/download-jpg", async (req, res) => {
  const { name, course, date, duration } = req.query;
  let browser;
  try {
    browser = await puppeteer.launch(puppeteerLaunchOptions);
    const page = await browser.newPage();

    await page.setViewport({
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
    });

    await page.setContent(
      generateCertificateHtml(name, course, date, duration)
    );

    const element = await page.$("#certificate");
    const boundingBox = await element.boundingBox();

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 100,
      clip: boundingBox,
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(name)}_certificate.jpg`
    );
    res.send(screenshot);
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).send(`Error generating JPG: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});

function generateCertificateHtml(name, course, date, duration) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate of Completion</title>
          <style>
                body {
                    font-family: 'Open Sans', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .certificate {
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 40px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #335EF6;
                    font-family: 'Montserrat', sans-serif;
                }
                .logo img {
                    height: 50px;
                    width: auto;
                }
                .certificate-info {
                    font-size: 10px;
                    text-align: right;
                    color: #6a6f73;
                }
                .title {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                    color: #335EF6;
                    font-family: 'Montserrat', sans-serif;
                }
                .course-title {
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Montserrat', sans-serif;
                    color: #335EF6;
                }
                .instructors {
                    font-size: 18px;
                    margin-bottom: 40px;
                    color: #6a6f73;
                }
                .student-name {
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Montserrat', sans-serif;
                }
                .completion-info {
                    font-size: 18px;
                    color: #6a6f73;
                }
                .download-buttons {
                    text-align: center;
                    margin-top: 20px;
                }
                .download-button {
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 0 10px;
                    background-color: #335EF6;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: bold;
                }
          </style>
      </head>
      <body>
          <div class="certificate" id="certificate">
              <div class="header">
                  <div class="logo">
                        <img src="https://i.ibb.co/s38yRnZ/logohotizantal.png" alt="Your Logo">
                    </div>
                  <div class="certificate-info">
                      Certificate no: UC-${Math.random().toString(36).substr(2, 9)}<br>
                      Certificate url: ude.my/UC-${Math.random().toString(36).substr(2, 9)}<br>
                      Reference Number: ${Math.floor(1000 + Math.random() * 9000)}
                  </div>
              </div>
              
              <div class="title">Certificate of Completion</div>
              
              <div class="course-title">
                  ${course}
              </div>
              
              <div class="instructors">
                  Instructors: Your App Instructors
              </div>
              
              <div class="student-name">
                  ${name}
              </div>
              
              <div class="completion-info">
                  Date ${date}<br>
                  Length ${duration}
              </div>
          </div>
      </body>
      </html>
    `;
}

module.exports = router;
