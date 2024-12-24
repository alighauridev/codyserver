// seeders/snippetSeeder.js
require("dotenv").config();
const mongoose = require("mongoose");
const CodeSnippet = require("./models/CodeSnippet");
// Set strictQuery to false to prepare for Mongoose 7
mongoose.set("strictQuery", false);
const BEGINNER_SNIPPETS = [
  {
    id: "b1",
    title: "Simple Text Styling",
    description: "Basic text formatting with different styles",
    html: `<div class="text-container">
    <h1 class="main-title">Welcome to Web Development</h1>
    <p class="colored-text">This is a colored paragraph.</p>
    <p class="big-text">This is bigger text!</p>
    <p class="fancy-text">This text has a special font.</p>
    <p class="spaced-text">This text has more spacing.</p>
  </div>`,
    css: `.text-container {
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  .main-title {
    color: var(--accent-primary);
    text-align: center;
  }
  
  .colored-text {
    color: var(--accent-secondary);
  }
  
  .big-text {
    font-size: 24px;
    color: var(--text-primary);
  }
  
  .fancy-text {
    font-family: 'Cursive', sans-serif;
    color: var(--accent-primary);
  }
  
  .spaced-text {
    letter-spacing: 2px;
    line-height: 1.6;
    color: var(--text-secondary);
  }`,
    js: `// No JavaScript needed for this example`,
  },
  {
    id: "b2",
    title: "Basic Button Styles",
    description: "Different button styles for beginners",
    html: `<div class="button-container">
    <button class="basic-button">Basic Button</button>
    <button class="rounded-button">Rounded Button</button>
    <button class="colored-button">Colored Button</button>
    <button class="outline-button">Outline Button</button>
    <button class="shadow-button">Shadow Button</button>
  </div>`,
    css: `.button-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
  }
  
  .basic-button {
    padding: 10px 20px;
    border: none;
    background-color: var(--accent-primary);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .rounded-button {
    padding: 10px 20px;
    border: none;
    background-color: var(--accent-secondary);
    color: white;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .colored-button {
    padding: 10px 20px;
    border: none;
    background-color: var(--accent-warning);
    color: var(--text-primary);
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .outline-button {
    padding: 10px 20px;
    background-color: transparent;
    color: var(--accent-primary);
    border: 2px solid var(--accent-primary);
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .shadow-button {
    padding: 10px 20px;
    border: none;
    background-color: var(--accent-primary);
    color: white;
    border-radius: 5px;
    box-shadow: 0 2px 5px var(--shadow-color);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }`,
    js: `// Simple hover effect demo
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('mouseover', function() {
      this.style.opacity = '0.8';
    });
    
    button.addEventListener('mouseout', function() {
      this.style.opacity = '1';
    });
  });`,
  },
  {
    id: "b3",
    title: "Simple Image Gallery",
    description: "Basic image gallery with thumbnails",
    html: `<div class="gallery">
    <h2>My Photo Gallery</h2>
    <div class="thumbnail-container">
      <img src="https://picsum.photos/100/100?1" class="thumbnail" alt="Thumbnail 1">
      <img src="https://picsum.photos/100/100?2" class="thumbnail" alt="Thumbnail 2">
      <img src="https://picsum.photos/100/100?3" class="thumbnail" alt="Thumbnail 3">
    </div>
    <div class="main-image">
      <img src="https://picsum.photos/400/300?1" id="featured" alt="Featured Image">
    </div>
  </div>`,
    css: `.gallery {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  
  .thumbnail-container {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .thumbnail {
    width: 100px;
    height: 100px;
    object-fit: cover;
    cursor: pointer;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .thumbnail:hover {
    border-color: var(--accent-primary);
    transform: translateY(-2px);
  }
  
  .main-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--shadow-color);
    border: 1px solid var(--border-color);
  }`,
    js: `const thumbnails = document.querySelectorAll('.thumbnail');
  const featured = document.getElementById('featured');
  
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', function() {
      featured.src = this.src.replace('100/100', '400/300');
    });
  });`,
  },
  {
    id: "b4",
    title: "Basic Counter",
    description: "Simple counter with increment and decrement",
    html: `<div class="counter-container">
    <h2>Simple Counter</h2>
    <div class="counter">
      <button id="decrease">-</button>
      <span id="count">0</span>
      <button id="increase">+</button>
    </div>
    <button id="reset">Reset</button>
  </div>`,
    css: `.counter-container {
    text-align: center;
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  .counter {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 20px 0;
  }
  
  #count {
    font-size: 24px;
    min-width: 50px;
    color: var(--text-primary);
  }
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 18px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  #decrease {
    background-color: #f44336;
    color: white;
  }
  
  #increase {
    background-color: var(--accent-secondary);
    color: white;
  }
  
  #reset {
    background-color: var(--accent-primary);
    color: white;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }`,
    js: `let count = 0;
  const countDisplay = document.getElementById('count');
  const decreaseBtn = document.getElementById('decrease');
  const increaseBtn = document.getElementById('increase');
  const resetBtn = document.getElementById('reset');
  
  function updateDisplay() {
    countDisplay.textContent = count;
  }
  
  decreaseBtn.addEventListener('click', () => {
    count--;
    updateDisplay();
  });
  
  increaseBtn.addEventListener('click', () => {
    count++;
    updateDisplay();
  });
  
  resetBtn.addEventListener('click', () => {
    count = 0;
    updateDisplay();
  });`,
  },
  {
    id: "b5",
    title: "Simple Form",
    description: "Basic form with validation",
    html: `<div class="form-container">
    <h2>Contact Form</h2>
    <form id="simple-form">
      <div class="form-group">
        <label for="name">Name:</label>
        <input type="text" id="name" required>
        <span class="error-message"></span>
      </div>
      
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" required>
        <span class="error-message"></span>
      </div>
      
      <div class="form-group">
        <label for="message">Message:</label>
        <textarea id="message" required></textarea>
        <span class="error-message"></span>
      </div>
      
      <button type="submit">Send</button>
    </form>
  </div>`,
    css: `.form-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    color: var(--text-primary);
  }
  
  input, textarea {
    width: 100%;
    padding: 8px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    transition: all 0.3s ease;
  }
  
  input:focus, textarea:focus {
    border-color: var(--accent-primary);
    outline: none;
  }
  
  textarea {
    height: 100px;
    resize: vertical;
  }
  
  .error-message {
    color: #f44336;
    font-size: 14px;
    display: block;
    margin-top: 5px;
  }
  
  button {
    width: 100%;
    padding: 10px;
    background-color: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }`,
    js: `const form = document.getElementById('simple-form');
  const inputs = form.querySelectorAll('input, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
  });
  
  function validateField(e) {
    const input = e.target;
    const errorSpan = input.nextElementSibling;
    
    if (!input.value) {
      errorSpan.textContent = 'This field is required';
      input.classList.add('error');
    } else if (input.type === 'email' && !isValidEmail(input.value)) {
      errorSpan.textContent = 'Please enter a valid email';
      input.classList.add('error');
    } else {
      errorSpan.textContent = '';
      input.classList.remove('error');
    }
  }
  
  function isValidEmail(email) {
    return email.includes('@') && email.includes('.');
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value) {
        isValid = false;
        const errorSpan = input.nextElementSibling;
        errorSpan.textContent = 'This field is required';
        input.classList.add('error');
      }
    });
    
    if (isValid) {
      alert('Form submitted successfully!');
      form.reset();
    }
  });`,
  },
  {
    id: "b6",
    title: "Color Changer",
    description: "Simple background color changer",
    html: `<div class="color-changer">
    <h2>Background Color Changer</h2>
    <div class="color-buttons">
      <button class="color-btn" data-color="var(--accent-primary)">Primary</button>
      <button class="color-btn" data-color="var(--accent-secondary)">Secondary</button>
      <button class="color-btn" data-color="var(--accent-warning)">Warning</button>
      <button class="color-btn" data-color="var(--bg-secondary)">Background</button>
    </div>
    <button id="random-color">Random Color</button>
  </div>`,
    css: `.color-changer {
    text-align: center;
    padding: 20px;
    min-height: 200px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  
  .color-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
    flex-wrap: wrap;
  }
  
  .color-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    color: white;
    transition: all 0.3s ease;
  }
  
  .color-btn:nth-child(1) { background-color: var(--accent-primary); }
  .color-btn:nth-child(2) { background-color: var(--accent-secondary); }
  .color-btn:nth-child(3) { background-color: var(--accent-warning); }
  .color-btn:nth-child(4) { 
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  
  #random-color {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    background-color: var(--accent-primary);
    color: white;
    margin-top: 20px;
    transition: all 0.3s ease;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }`,
    js: `const colorBtns = document.querySelectorAll('.color-btn');
  const randomBtn = document.getElementById('random-color');
  const container = document.querySelector('.color-changer');
  
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      container.style.backgroundColor = color;
    });
  });
  
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  randomBtn.addEventListener('click', () => {
    const randomColor = getRandomColor();
    container.style.backgroundColor = randomColor;
  });`,
  },
  {
    id: "b7",
    title: "Theme-Aware Grid Layout",
    description: "Responsive grid with theme support",
    html: `<div class="grid-container">
    <div class="grid-item">
      <h3>Card 1</h3>
      <p>This is a themed grid card that adapts to light and dark modes.</p>
    </div>
    <div class="grid-item">
      <h3>Card 2</h3>
      <p>The grid automatically adjusts based on screen size.</p>
    </div>
    <div class="grid-item">
      <h3>Card 3</h3>
      <p>Cards use theme variables for consistent styling.</p>
    </div>
    <div class="grid-item">
      <h3>Card 4</h3>
      <p>Hover effects are smooth with transitions.</p>
    </div>
  </div>`,
    css: `.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px;
    background-color: var(--bg-primary);
    border-radius: 8px;
  }
  
  .grid-item {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
  }
  
  .grid-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px var(--shadow-color);
  }
  
  .grid-item h3 {
    color: var(--text-primary);
    margin-bottom: 10px;
    font-size: 1.2em;
  }
  
  .grid-item p {
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }`,
    js: `// Add hover effect
  const gridItems = document.querySelectorAll('.grid-item');
  
  gridItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.borderColor = 'var(--accent-primary)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.borderColor = 'var(--border-color)';
    });
  });`,
  },
  {
    id: "b8",
    title: "Theme Toggle Switch",
    description: "Custom theme toggle with animation",
    html: `<div class="theme-container">
    <label class="theme-switch">
      <input type="checkbox" id="theme-toggle">
      <span class="slider">
        <span class="sun">☀️</span>
        <span class="moon">🌙</span>
      </span>
    </label>
    <div class="content">
      <h2>Theme Toggle Example</h2>
      <p>Click the switch to toggle between light and dark themes!</p>
      <div class="demo-card">
        <p>This card adapts to the current theme</p>
      </div>
    </div>
  </div>`,
    css: `.theme-container {
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }
  
  .theme-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  }
  
  .theme-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    transition: .4s;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 3px;
    background-color: var(--accent-primary);
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  .sun, .moon {
    font-size: 16px;
  }
  
  .content {
    margin-top: 20px;
  }
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 10px;
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }
  
  .demo-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
    transition: all 0.3s ease;
  }`,
    js: `const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      root.style.setProperty('--bg-primary', '#2A2A2A');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#A0A0A0');
      root.style.setProperty('--border-color', '#454545');
      root.style.setProperty('--accent-primary', '#0e639c');
    } else {
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F7F7F7');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', '#CCCCCC');
      root.style.setProperty('--accent-primary', '#007ACC');
    }
  });`,
  },
  {
    id: "b9",
    title: "Navigation Menu",
    description: "Simple navigation with theme support",
    html: `<nav class="nav-container">
    <div class="nav-brand">Logo</div>
    <ul class="nav-menu">
      <li><a href="#" class="nav-link">Home</a></li>
      <li><a href="#" class="nav-link">About</a></li>
      <li><a href="#" class="nav-link">Services</a></li>
      <li><a href="#" class="nav-link">Contact</a></li>
    </ul>
    <button class="nav-toggle">☰</button>
  </nav>
  <div class="content">
    <h2>Navigation Example</h2>
    <p>A responsive navigation menu that works in both light and dark themes.</p>
  </div>`,
    css: `.nav-container {
    background-color: var(--bg-secondary);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }
  
  .nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-primary);
  }
  
  .nav-menu {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 1rem;
  }
  
  .nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .nav-link:hover {
    color: var(--accent-primary);
    background-color: var(--bg-primary);
  }
  
  .nav-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .content {
    padding: 20px;
  }
  
  @media (max-width: 768px) {
    .nav-toggle {
      display: block;
    }
  
    .nav-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: var(--bg-secondary);
      flex-direction: column;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
  
    .nav-menu.active {
      display: flex;
    }
  }`,
    js: `const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
      navMenu.classList.remove('active');
    }
  });`,
  },
];
// Transform the snippets to match your schema
const transformSnippets = (snippets) => {
  return snippets.map((snippet) => ({
    title: snippet.title,
    description: snippet.description,
    level: "beginner",
    tags: ["html", "css", "javascript", "frontend"],
    status: "published",
    publishedAt: new Date(),
    codeBlocks: [
      {
        language: "html",
        code: snippet.html,
        filename: "index.html",
      },
      {
        language: "css",
        code: snippet.css,
        filename: "styles.css",
      },
      {
        language: "javascript",
        code: snippet.js,
        filename: "script.js",
      },
    ],
    featuredImage: {
      url: `https://api.placeholder.com/snippets/${snippet.id}`,
      public_id: `snippet_${snippet.id}`,
    },
  }));
};

// Function to seed the database
const seedSnippets = async () => {
  try {
    await mongoose.connect(process.env.DEVELOPMENT_MONGODB_URL);
    console.log("Connected to MongoDB...");

    // Drop the problematic index if it exists
    try {
      await CodeSnippet.collection.dropIndex("slug_1");
      console.log("Dropped slug index");
    } catch (error) {
      // Index might not exist, continue
    }

    await CodeSnippet.deleteMany({ level: "beginner" });
    console.log("Cleared existing beginner snippets...");

    for (const originalSnippet of BEGINNER_SNIPPETS) {
      try {
        const transformedSnippet = transformSnippets([originalSnippet])[0];
        await CodeSnippet.create(transformedSnippet);
        console.log(`Successfully inserted: ${transformedSnippet.title}`);
      } catch (error) {
        console.error(
          `Error inserting snippet ${originalSnippet.title}:`,
          error.message
        );
      }
    }

    console.log("Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};
// Create a function to seed a single snippet
const seedSingleSnippet = async (snippet) => {
  try {
    const transformed = transformSnippets([snippet])[0];
    const existingSnippet = await CodeSnippet.findOne({
      title: transformed.title,
    });

    if (existingSnippet) {
      // Update existing snippet
      await CodeSnippet.findByIdAndUpdate(existingSnippet._id, transformed);
      console.log(`Updated snippet: ${transformed.title}`);
    } else {
      // Create new snippet
      await CodeSnippet.create(transformed);
      console.log(`Created new snippet: ${transformed.title}`);
    }
  } catch (error) {
    console.error(`Error seeding snippet ${snippet.title}:`, error);
  }
};

seedSnippets();
