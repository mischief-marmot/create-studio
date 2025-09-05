(function(d, w) {
  'use strict';
  
  // Prevent multiple initializations
  if (w.Halogen && w.Halogen.initialized) return;
  
  // Set up Halogen global namespace and command queue
  w.Halogen || ((w.Halogen = function(command, data) {
    w.Halogen._.push([command, data]);
  }), (w.Halogen._ = []));
  
  // Get the currently executing script (for inline usage)
  var currentScript = d.currentScript || d.scripts[d.scripts.length - 1];
  
  // Extract configuration from script attributes
  var siteUrl = currentScript.getAttribute('data-site-url');
  var creationId = currentScript.getAttribute('data-creation-id');
  var embedUrl = currentScript.getAttribute('data-embed-url') || 'http://localhost:3001';
  
  // Store configuration globally for the main script
  w.Halogen.config = {
    siteUrl: siteUrl,
    creationId: creationId,
    embedUrl: embedUrl
  };
  
  // Create and load the main embed script
  var mainScript = d.createElement('script');
  mainScript.type = 'text/javascript';
  mainScript.src = embedUrl + '/embed.min.js';
  mainScript.defer = true;
  mainScript.setAttribute('data-halogen-main', 'true');
  
  // Insert the main script before the first script tag
  var firstScript = d.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(mainScript, firstScript);
})(document, window);