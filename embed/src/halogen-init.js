(function(d, w) {
  'use strict';
  
  // Get the currently executing script (for inline usage)
  var currentScript = d.currentScript || d.scripts[d.scripts.length - 1];
  
  // Extract configuration from script attributes
  var siteUrl = currentScript.getAttribute('data-site-url');
  var creationId = currentScript.getAttribute('data-creation-id');
  var embedUrl = currentScript.getAttribute('data-embed-url') || 'http://localhost:3001';
  
  // Initialize Halogen config if not already present
  if (!w.Halogen) {
    // First script - initialize everything
    w.Halogen = function(command, data) {
      w.Halogen._.push([command, data]);
    };
    w.Halogen._ = [];
    w.Halogen.config = {
      siteUrl: siteUrl,
      embedUrl: embedUrl,
      creations: []
    };
  } else if (!w.Halogen.config) {
    // Halogen exists but config doesn't (shouldn't happen, but be safe)
    w.Halogen.config = {
      siteUrl: siteUrl,
      embedUrl: embedUrl,
      creations: []
    };
  }
  
  // Add this creation to the creations array if it has an ID
  if (creationId) {
    // Check if this creation ID already exists
    var exists = false;
    for (var i = 0; i < w.Halogen.config.creations.length; i++) {
      if (w.Halogen.config.creations[i].creationId === creationId) {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      w.Halogen.config.creations.push({
        creationId: creationId,
        siteUrl: siteUrl || w.Halogen.config.siteUrl
      });
    }
  }
  
  // Only load the main script once
  if (!w.Halogen.scriptLoaded && !d.querySelector('[data-halogen-main]')) {
    w.Halogen.scriptLoaded = true;
    
    // Create and load the main embed script
    var mainScript = d.createElement('script');
    mainScript.type = 'text/javascript';
    mainScript.src = embedUrl + '/embed.min.js';
    mainScript.defer = true;
    mainScript.setAttribute('data-halogen-main', 'true');
    
    // Insert the main script before the first script tag
    var firstScript = d.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(mainScript, firstScript);
  }
})(document, window);