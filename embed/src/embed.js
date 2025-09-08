(function(d, w) {
  'use strict';
  
  // Check if Halogen is already initialized
  if (w.Halogen && typeof w.Halogen === 'function' && w.Halogen.initialized) {
    return;
  }
  
  // Get configuration from the initializer
  var config = w.Halogen && w.Halogen.config || {};
  var embedUrl = config.embedUrl || 'http://localhost:3001';
  var siteUrl = config.siteUrl;
  var creations = config.creations || [];
  
  // Support backward compatibility - if creationId exists at root level, add it to creations
  if (config.creationId && creations.length === 0) {
    creations = [{ creationId: config.creationId, siteUrl: siteUrl }];
  }
  
  var debugMode = config.debug || embedUrl.includes('localhost') || (siteUrl && siteUrl.includes('localhost'));
  
  // Development-only logger
  var flogger = {
    log: function(message, data) {
      if (debugMode) {
        if (data !== undefined) {
          console.log('Halogen: ' + message, data);
        }
      }
    },
    
    warn: function(message, data) {
      if (debugMode) {
        if (data !== undefined) {
          console.warn('Halogen: ' + message, data);
        }
      }
    },
    
    error: function(message, data) {
      console.error('Halogen: ' + message, data);
    }
  };
  
  flogger.log('Embed config received:', config);
  flogger.log('Final values - siteUrl:', siteUrl, 'creations:', creations, 'embedUrl:', embedUrl);
  
  // Fetch site configuration
  function fetchSiteConfig(siteUrl, callback) {
    flogger.log('fetchSiteConfig called with siteUrl:', siteUrl);
    flogger.log('API URL:', embedUrl + '/api/site-config');
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', embedUrl + '/api/site-config', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      flogger.log('XHR readyState:', xhr.readyState, 'status:', xhr.status);
      
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          flogger.log('XHR response text:', xhr.responseText);
          try {
            var response = JSON.parse(xhr.responseText);
            flogger.log('Parsed response:', response);
            callback(null, response.config);
          } catch (e) {
            flogger.error('JSON parse error:', e);
            callback(e, null);
          }
        } else {
          flogger.error('XHR failed with status:', xhr.status);
          callback(new Error('Config request failed with status: ' + xhr.status), null);
        }
      }
    };
    
    flogger.log('Sending XHR request...');
    xhr.send(JSON.stringify({ siteUrl: siteUrl }));
  }

  // Create fullscreen modal
  function createModal(creationId, siteUrl) {
    var modal = d.createElement('div');
    modal.id = 'halogen-modal-' + creationId;
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999999;display:none;';
    
    var closeBtn = d.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:30px;background:none;border:none;color:white;font-size:40px;cursor:pointer;z-index:1000000;';
    
    var iframe = d.createElement('iframe');
    iframe.src = embedUrl + '/creations/' + creationId + '/interactive?site_url=' + encodeURIComponent(siteUrl);
    iframe.style.cssText = 'width:100%;height:100%;border:0;';
    iframe.setAttribute('title', 'Halogen Interactive Recipe');
    
    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    
    // Close handlers
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };
    
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };
    
    // ESC key handler
    d.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
      }
    });
    
    // Insert before body end
    d.body.appendChild(modal);
    
    return modal;
  }

  // Inject interactive button into recipe card
  function injectInteractiveButton(config, creationId, siteUrl) {
    flogger.log('injectInteractiveButton called', { config: config, creationId: creationId, siteUrl: siteUrl });
    
    if (!config.showInteractiveMode || !creationId) {
      flogger.log('Exiting - showInteractiveMode:', config.showInteractiveMode, 'creationId:', creationId);
      return;
    }
    
    // Find the recipe card section
    var recipeSection = d.querySelector('section#mv-creation-' + creationId);
    flogger.log('Looking for section#mv-creation-' + creationId);
    flogger.log('Recipe section found:', !!recipeSection);
    
    if (!recipeSection) { 
      flogger.warn('Recipe section not found for creation ID:', creationId);
      return;
    }
    
    // Find the target element within the section
    flogger.log('Looking for selector:', config.buttonSelector);   
    var targetElement = recipeSection.querySelector(config.buttonSelector);
    flogger.log('Target element found:', !!targetElement);
    
    if (!targetElement) {
      flogger.warn('Target element not found:', config.buttonSelector);
      return;
    }
    
    // Check if button already exists
    var existingButton = targetElement.querySelector('.halogen-interactive-btn');
    flogger.log('Existing button found:', !!existingButton);
    
    if (existingButton) {
      flogger.log('Button already exists, skipping injection');
      return;
    }
    
    // Create the button
    flogger.log('Creating button...');
    var button = d.createElement('button');
    button.className = 'halogen-interactive-btn';
    button.textContent = config.buttonText || 'Try Interactive Mode!';
    button.style.cssText = 'background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;margin:10px 0;display:inline-block;';
    
    // Create modal when clicked
    button.onclick = function() {
      var modalId = 'halogen-modal-' + creationId;
      var modal = d.getElementById(modalId);
      if (!modal) {
        modal = createModal(creationId, siteUrl);
      }
      modal.style.display = 'block';
    };
    
    // Insert button
    flogger.log('Appending button to target element...');
    targetElement.appendChild(button);

    flogger.log('Interactive button added to recipe card');
  }

  // Main Halogen implementation (fallback iframe embed)
  function createEmbed(targetElement, options) {
    options = options || {};
    
    var iframe = d.createElement('iframe');
    var params = [];
    
    // Add configuration parameters
    if (siteUrl) params.push('site-url=' + encodeURIComponent(siteUrl));
    // For fallback embeds, use first creation if available
    if (creations.length > 0 && creations[0].creationId) {
      params.push('creation-id=' + encodeURIComponent(creations[0].creationId));
    }
    
    // Add any additional options
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        params.push(key + '=' + encodeURIComponent(options[key]));
      }
    }
    
    iframe.src = embedUrl + '/embed' + (params.length ? '?' + params.join('&') : '');
    iframe.style.cssText = 'width:100%;height:400px;border:0';
    iframe.setAttribute('title', 'Halogen Embed');
    iframe.setAttribute('data-halogen-iframe', 'true');
    
    targetElement.appendChild(iframe);
    
    return iframe;
  }
  
  // Process command queue
  function processCommand(command, data) {
    flogger.log('Processing command:', command, 'with data:', data);
    switch (command) {
      case 'embed':
        // Process all creations
        if (creations.length > 0) {
          // Get unique site URLs to fetch configs
          var processedSites = {};
          
          for (var i = 0; i < creations.length; i++) {
            (function(creation) {
              var creationSiteUrl = creation.siteUrl || siteUrl;
              
              if (!creationSiteUrl) {
                flogger.warn('No siteUrl for creation:', creation.creationId);
                return;
              }
              
              // Fetch config once per unique site
              if (!processedSites[creationSiteUrl]) {
                processedSites[creationSiteUrl] = true;
                
                fetchSiteConfig(creationSiteUrl, function(error, siteConfig) {
                  if (error) {
                    flogger.warn('Failed to fetch site config for', creationSiteUrl, error);
                  } else {
                    // Inject buttons for all creations from this site
                    for (var j = 0; j < creations.length; j++) {
                      var c = creations[j];
                      if ((c.siteUrl || siteUrl) === creationSiteUrl) {
                        injectInteractiveButton(siteConfig, c.creationId, creationSiteUrl);
                      }
                    }
                  }
                });
              }
            })(creations[i]);
          }
          
          // Also handle [data-halogen] elements as fallback
          fallbackEmbed(data);
        } else {
          // No creations available, use fallback
          fallbackEmbed(data);
        }
        break;
      case 'create':
        // Create embed in specific element
        if (data && data.element) {
          createEmbed(data.element, data.options || {});
        }
        break;
    }
  }
  
  // Fallback embed for [data-halogen] elements
  function fallbackEmbed(data) {
    var elements = d.querySelectorAll('[data-halogen]');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      // Skip if already embedded
      if (!element.querySelector('[data-halogen-iframe]')) {
        createEmbed(element, data || {});
      }
    }
  }
  
  // Replace the placeholder function with real implementation
  var commandQueue = w.Halogen && w.Halogen._ || [];
  w.Halogen = function(command, data) {
    processCommand(command, data);
  };
  
  // Mark as initialized
  w.Halogen.initialized = true;
  w.Halogen.createEmbed = createEmbed;
  
  // Process any queued commands
  for (var i = 0; i < commandQueue.length; i++) {
    var queuedCommand = commandQueue[i];
    processCommand(queuedCommand[0], queuedCommand[1]);
  }
  
  // Auto-embed on page load
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', function() {
      processCommand('embed');
    });
  } else {
    processCommand('embed');
  }
  
})(document, window);