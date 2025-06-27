require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

// Heroku API configuration
const HEROKU_API_KEY = 'HRKU-AAPQ-RRL2Mar65Wh1NDLIMQazWm0eaRPK3tHzMfVe3KQ_____w2NW1oyHeQt';
const GITHUB_REPO = 'https://github.com/CHMA2009/-CHAMA-MD/archive/main.tar.gz';

// App configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulate Heroku deployment
const deployToHeroku = async (appName, sessionId) => {
  try {
    // Step 1: Create Heroku app
    const appResponse = await axios.post('https://api.heroku.com/apps', {
      name: appName,
      region: 'us',
      stack: 'container'
    }, {
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${HEROKU_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Set config vars
    await axios.patch(`https://api.heroku.com/apps/${appName}/config-vars`, {
      SESSION_ID: sessionId,
      OWNER_NUMBER: '94773024361',
      PREFIX: '.'
    }, {
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${HEROKU_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 3: Deploy from GitHub
    const buildResponse = await axios.post(`https://api.heroku.com/apps/${appName}/builds`, {
      source_blob: {
        url: GITHUB_REPO,
        version: "main"
      }
    }, {
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${HEROKU_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      appUrl: `https://${appName}.herokuapp.com`,
      dashboardUrl: `https://dashboard.heroku.com/apps/${appName}`,
      logsUrl: `https://dashboard.heroku.com/apps/${appName}/activity/builds/${buildResponse.data.id}`
    };
  } catch (error) {
    console.error('Heroku deployment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('deploy', {
    message: req.query.message,
    error: req.query.error
  });
});

app.post('/deploy', async (req, res) => {
  const { appName, sessionId } = req.body;

  if (!appName || !sessionId) {
    return res.redirect('/?error=App+name+and+Session+ID+are+required');
  }

  const result = await deployToHeroku(appName, sessionId);

  if (result.success) {
    res.redirect(`/?message=App+deployed+successfully!+Access+it+at+${result.appUrl}`);
  } else {
    res.redirect(`/?error=Deployment+failed:+${result.error}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Deployer running on http://localhost:${PORT}`);
});
