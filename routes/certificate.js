const express = require("express");
const puppeteer = require("puppeteer");
const User = require("../models/userModel");
const Certificate = require("../models/certificate");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { uploadCloudinary } = require("../utils/cloudinary");
const isAuthenticated = require("../middlewares/auth");
const puppeteerLaunchOptions = {
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--font-render-hinting=none", // Helps with font rendering
    "--disable-web-security", // Helps with loading external resources
  ],
  executablePath:
    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // Windows path
      : "/usr/bin/google-chrome", // Linux path
  timeout: 30000,
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

// Helper function for temporary file management
async function createTempFile(buffer, extension) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "certificate-"));
  const tempFilePath = path.join(tempDir, `temp.${extension}`);
  await fs.writeFile(tempFilePath, buffer);
  return { tempFilePath, tempDir };
}

async function cleanupTempFiles(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true });
  } catch (error) {
    console.error("Error cleaning up temp files:", error);
  }
}

// Get all certificates
// router.get("/", async (req, res) => {
//   try {
//     const certificates = await Certificate.find();
//     res.json(certificates);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Get a specific certificate
router.get("/:id", async (req, res) => {
  console.log("certificate route is working");

  try {
    const certificate = await Certificate.findOne({
      courseId: req.params.id,
      userId: req.query.userId,
    });
    if (certificate == null) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    res.json({ certificate });
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
  let browser = null;
  let page = null;

  try {
    // Launch browser
    browser = await puppeteer.launch(puppeteerLaunchOptions);

    // Create new page
    page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 800,
      height: 600,
      deviceScaleFactor: 2, // Higher resolution
    });

    // Set content with waiting for network idle
    await page.setContent(
      generateCertificateHtml(name, course, date, duration),
      {
        waitUntil: ["load", "networkidle0"],
        timeout: 30000,
      }
    );

    // Wait for the certificate element to be rendered
    await page.waitForSelector("#certificate", { timeout: 5000 });

    // Generate PDF with specific options
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      preferCSSPageSize: true,
      scale: 0.8,
    });
    console.log({
      pdf,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(name)}_certificate.pdf"`
    );

    // Send PDF
    res.send(pdf);
  } catch (error) {
    console.error("Detailed PDF generation error:", error);
    res.status(500).json({
      error: "PDF generation failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    // Clean up
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error("Error closing page:", e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Error closing browser:", e);
      }
    }
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
      encoding: "base64",
    });

    // res.setHeader("Content-Type", "image/jpeg");
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename=${encodeURIComponent(name)}_certificate.jpg`
    // );
    console.log({ screenshot });

    res.send({ screenshot });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).send(`Error generating JPG: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});

router.post("/generate-png", async (req, res) => {
  const { name, course, date, duration, userId } = req.query;
  let browser = null;
  let page = null;
  let tempDir = null;

  try {
    browser = await puppeteer.launch(puppeteerLaunchOptions);
    page = await browser.newPage();

    // Set viewport for high-resolution PNG
    await page.setViewport({
      width: 1000,
      height: 700,
      deviceScaleFactor: 2, // Higher resolution
    });

    // Set content with transparent background
    await page.setContent(
      generateCertificateHtml(name, course, date, duration),
      {
        waitUntil: ["load", "networkidle0"],
        timeout: 30000,
      }
    );

    await page.waitForSelector("#certificate", { timeout: 5000 });

    // Generate PNG with transparency
    const pngBuffer = await page.screenshot({
      type: "png",
      omitBackground: true, // Enable transparency
      fullPage: true,
      encoding: "binary",
      captureBeyondViewport: true,
    });

    // Create temporary file
    const { tempFilePath, tempDir: newTempDir } = await createTempFile(
      pngBuffer,
      "png"
    );
    tempDir = newTempDir;

    // Upload to Cloudinary with PNG-specific options
    const cloudinaryResponse = await uploadCloudinary(
      tempFilePath,
      "certificates/png",
      {
        resource_type: "image",
        public_id: `certificate_${userId}_png_${Date.now()}`,
        format: "png",
        quality: 100,
        flags: "preserve_transparency",
        tags: ["certificate", "png"],
      }
    );

    // // Update or create certificate record
    // if (userId) {
    //   await Certificate.findOneAndUpdate(
    //     { userId },
    //     {
    //       $set: {
    //         pngUrl: cloudinaryResponse.secure_url,
    //         pngPublicId: cloudinaryResponse.public_id,
    //         name,
    //         course,
    //         date,
    //         duration,
    //         lastUpdated: new Date()
    //       }
    //     },
    //     { new: true, upsert: true }
    //   );
    // }

    res.json({
      success: true,
      message: "PNG Certificate generated successfully",
      certificate: {
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        format: "png",
        size: cloudinaryResponse.bytes,
      },
    });
  } catch (error) {
    console.error("PNG Certificate generation error:", error);
    res.status(500).json({
      error: "PNG Certificate generation failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    // Cleanup resources
    if (page) await page.close().catch(console.error);
    if (browser) await browser.close().catch(console.error);
    if (tempDir) await cleanupTempFiles(tempDir).catch(console.error);
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
