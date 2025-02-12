// ann-smc-slc.js - HMStudio test for ann-smc-slc v1.0.0

(function() {
    console.log('HMStudio All Features script initialized');
  
    // =============== ANNOUNCEMENT BAR FEATURE ===============
    // HMStudio Announcement Bar v1.2.6
// Created by HMStudio
// https://github.com/your-username/hmstudio-announcement
(function() {
    console.log('Announcement Bar script initialized');
  
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const storeId = scriptUrl.searchParams.get('storeId');
      return storeId ? storeId.split('?')[0] : null;
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || 'ar';
    }
  
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
      console.error('Store ID not found in script URL');
      return;
    }
  
    async function fetchAnnouncementSettings() {
      try {
        const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getAnnouncementSettings?storeId=${storeId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched announcement settings:', data);
        return data;
      } catch (error) {
        console.error('Error fetching announcement settings:', error);
        return null;
      }
    }
  
    function createAnnouncementBar(settings) {
      // Remove existing announcement bar if any
      const existingBar = document.getElementById('hmstudio-announcement-bar');
      if (existingBar) {
        existingBar.remove();
      }
  
      // Create bar container
      const bar = document.createElement('div');
      bar.id = 'hmstudio-announcement-bar';
      bar.style.cssText = `
        width: 100%;
        background-color: ${settings.announcementBackgroundColor};
        color: ${settings.announcementTextColor};
        overflow: hidden;
        height: 40px;
        position: relative;
        z-index: 999999;
      `;
  
      // Create content container
      const tickerContent = document.createElement('div');
      tickerContent.id = 'tickerContent';
      tickerContent.style.cssText = `
        position: absolute;
        white-space: nowrap;
        height: 100%;
        display: flex;
        align-items: center;
        will-change: transform;
        transform: translateX(0);
      `;
  
      // Calculate number of copies needed (initial)
      const tempSpan = document.createElement('span');
      tempSpan.textContent = settings.announcementText;
      tempSpan.style.cssText = `
        display: inline-block;
        padding: 0 3rem;
        visibility: hidden;
        position: absolute;
      `;
      document.body.appendChild(tempSpan);
      const textWidth = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);
  
      // Create enough copies to fill twice the viewport width
      const viewportWidth = window.innerWidth;
      const copiesNeeded = Math.ceil((viewportWidth * 3) / textWidth) + 2;
  
      for (let i = 0; i < copiesNeeded; i++) {
        const textSpan = document.createElement('span');
        textSpan.textContent = settings.announcementText;
        textSpan.style.cssText = `
          display: inline-block;
          padding: 0 3rem;
        `;
        tickerContent.appendChild(textSpan);
      }
  
      // Add content to bar
      bar.appendChild(tickerContent);
  
      // Insert at the top of the page
      const targetLocation = document.querySelector('.header');
      if (targetLocation) {
        targetLocation.insertBefore(bar, targetLocation.firstChild);
      } else {
        document.body.insertBefore(bar, document.body.firstChild);
      }
  
      // Animation variables
      let currentPosition = 0;
      let lastTimestamp = 0;
      let animationId;
      let isPaused = false;
  
      // Convert speed setting to pixels per second
      // Adjust these values to slow down the animation
      const minSpeed = 10; // Minimum speed in pixels per second
      const maxSpeed = 100; // Maximum speed in pixels per second
      const speedRange = maxSpeed - minSpeed;
      const speedPercentage = (60 - settings.announcementSpeed) / 55; // Convert 5-60 range to 0-1
      const pixelsPerSecond = minSpeed + (speedRange * speedPercentage);
  
      function updateAnimation(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        
        if (!isPaused) {
          // Calculate time difference in seconds
          const deltaTime = (timestamp - lastTimestamp) / 1000;
          
          // Update position using precise calculations
          const movement = pixelsPerSecond * deltaTime;
          currentPosition += movement;
  
          // Reset position when necessary
          if (currentPosition >= textWidth) {
            // Adjust position to maintain smoothness
            currentPosition = currentPosition % textWidth;
            
            // Move first item to end for smooth transition
            const firstItem = tickerContent.children[0];
            tickerContent.appendChild(firstItem.cloneNode(true));
            tickerContent.removeChild(firstItem);
          }
  
          // Use transform3d for smoother animation
          tickerContent.style.transform = `translate3d(${currentPosition}px, 0, 0)`;
        }
  
        lastTimestamp = timestamp;
        animationId = requestAnimationFrame(updateAnimation);
      }
  
      // Start animation with a slight delay to ensure proper initialization
      setTimeout(() => {
        lastTimestamp = 0;
        animationId = requestAnimationFrame(updateAnimation);
      }, 100);
  
      // Add hover pause functionality
      bar.addEventListener('mouseenter', () => {
        isPaused = true;
      });
  
      bar.addEventListener('mouseleave', () => {
        isPaused = false;
        lastTimestamp = 0; // Reset timestamp for smooth resume
      });
  
      // Handle cleanup
      function cleanup() {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      }
  
      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          isPaused = true;
        } else {
          isPaused = false;
          lastTimestamp = 0; // Reset timestamp for smooth resume
        }
      });
  
      // Handle window resize
      window.addEventListener('resize', () => {
        const newViewportWidth = window.innerWidth;
        const newCopiesNeeded = Math.ceil((newViewportWidth * 3) / textWidth) + 2;
  
        // Adjust number of copies if needed
        while (tickerContent.children.length < newCopiesNeeded) {
          const clone = tickerContent.children[0].cloneNode(true);
          tickerContent.appendChild(clone);
        }
  
        // Reset position for smooth transition after resize
        currentPosition = 0;
        lastTimestamp = 0;
        tickerContent.style.transform = `translate3d(${currentPosition}px, 0, 0)`;
      });
  
      // Cleanup on page unload
      window.addEventListener('unload', cleanup);
    }
  
    // Initialize announcement bar
    async function initializeAnnouncementBar() {
      const settings = await fetchAnnouncementSettings();
      if (settings && settings.announcementEnabled) {
        createAnnouncementBar({
          ...settings,
          // Keep original speed value (5-60)
          announcementSpeed: Math.max(5, Math.min(60, settings.announcementSpeed))
        });
      }
    }
  
    // Run initialization
    initializeAnnouncementBar();
  
    // Optional: Re-initialize on dynamic content changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && !document.getElementById('hmstudio-announcement-bar')) {
          initializeAnnouncementBar();
          break;
        }
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  })();
    // =============== SMART CART FEATURE ===============
    // src/scripts/smartCart.js v1.7.1
// HMStudio Smart Cart with Campaign Support
(function() {
    console.log('Smart Cart script initialized');
  
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const storeId = scriptUrl.searchParams.get('storeId');
      return storeId ? storeId.split('?')[0] : null;
    }
  
    function getCampaignsFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const campaignsData = scriptUrl.searchParams.get('campaigns');
      
      if (!campaignsData) {
          console.log('No campaigns data found in URL');
          return [];
      }
  
      try {
          const decodedData = atob(campaignsData);
          const parsedData = JSON.parse(decodedData);
          
          return parsedData.map(campaign => ({
              ...campaign,
              timerSettings: {
                  ...campaign.timerSettings,
                  textAr: decodeURIComponent(campaign.timerSettings.textAr || ''),
                  textEn: decodeURIComponent(campaign.timerSettings.textEn || ''),
                  autoRestart: campaign.timerSettings.autoRestart || false
              }
          }));
      } catch (error) {
          console.error('Error parsing campaigns data:', error);
          return [];
      }
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || 'ar';
    }
  
    function isMobile() {
      return window.innerWidth <= 768;
    }
  
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
      console.error('Store ID not found in script URL');
      return;
    }
  
    const SmartCart = {
      settings: null,
      campaigns: getCampaignsFromUrl(),
      stickyCartElement: null,
      currentProductId: null,
      activeTimers: new Map(),
      updateInterval: null,
      originalDurations: new Map(),
  
      createStickyCart() {
        if (this.stickyCartElement) {
          this.stickyCartElement.remove();
        }
      
        const container = document.createElement('div');
        container.id = 'hmstudio-sticky-cart';
        container.style.cssText = `
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
          padding: ${isMobile() ? '12px' : '20px'};
          z-index: 999999;
          display: none;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          height: ${isMobile() ? 'auto' : '100px'};  // Added this line
        `;
  
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${isMobile() ? '8px' : '15px'};
          flex-wrap: ${isMobile() ? 'wrap' : 'nowrap'};
        `;
  
        // Quantity section container (for mobile layout)
        const quantityContainer = document.createElement('div');
        quantityContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          width: ${isMobile() ? '100%' : 'auto'};
          background: #f8f8f8;
          border-radius: 8px;
          padding: ${isMobile() ? '8px 12px' : '4px'};
        `;
  
        // Optional: Add quantity label
        const quantityLabel = document.createElement('span');
        quantityLabel.textContent = getCurrentLanguage() === 'ar' ? 'الكمية:' : 'Quantity:';
        quantityLabel.style.cssText = `
          font-size: ${isMobile() ? '14px' : '12px'};
          color: #666;
          ${isMobile() ? 'min-width: 60px;' : ''}
        `;
  
        const quantityWrapper = document.createElement('div');
        quantityWrapper.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          padding: 4px;
          ${isMobile() ? 'flex: 0 0 auto;' : ''}
        `;
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.style.cssText = `
          width: ${isMobile() ? '40px' : '28px'};
          height: ${isMobile() ? '40px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${isMobile() ? '18px' : '16px'};
          color: #666;
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;
        `;
      
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = '1';
        quantityInput.max = '10';
        quantityInput.value = '1';
        quantityInput.style.cssText = `
          width: ${isMobile() ? '60px' : '40px'};
          height: ${isMobile() ? '40px' : '28px'};
          text-align: center;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          background: white;
          font-size: ${isMobile() ? '16px' : '14px'};
          -moz-appearance: textfield;
          -webkit-appearance: none;
          margin: 0;
          padding: 0;
          ${isMobile() ? 'flex: 0 0 60px;' : ''};
        `;
      
        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = `
          width: ${isMobile() ? '40px' : '28px'};
          height: ${isMobile() ? '40px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${isMobile() ? '18px' : '16px'};
          color: #666;
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;
        `;
      
        // Add hover effects to buttons
        const addButtonHoverEffects = (button) => {
          button.addEventListener('mouseover', () => {
            button.style.background = '#f0f0f0';
          });
          button.addEventListener('mouseout', () => {
            button.style.background = '#f8f8f8';
          });
          button.addEventListener('mousedown', () => {
            button.style.background = '#e8e8e8';
          });
          button.addEventListener('mouseup', () => {
            button.style.background = '#f0f0f0';
          });
        };
  
        addButtonHoverEffects(decreaseBtn);
        addButtonHoverEffects(increaseBtn);
      
        const updateQuantity = (value) => {
          quantityInput.value = value;
          const originalSelect = document.querySelector('select#product-quantity');
          if (originalSelect) {
            originalSelect.value = value;
            const event = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(event);
          }
        };
      
        decreaseBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            updateQuantity(currentValue - 1);
          }
        });
      
        increaseBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue < 10) {
            updateQuantity(currentValue + 1);
          }
        });
      
        quantityInput.addEventListener('change', (e) => {
          let value = parseInt(e.target.value);
          if (isNaN(value) || value < 1) value = 1;
          if (value > 10) value = 10;
          updateQuantity(value);
        });
  
        // Prevent scrolling when focusing input on mobile
        quantityInput.addEventListener('focus', (e) => {
          e.preventDefault();
          if (isMobile()) {
            quantityInput.blur();
          }
        });
      
        const addButton = document.createElement('button');
        addButton.textContent = getCurrentLanguage() === 'ar' ? 'أضف للسلة' : 'Add to Cart';
        addButton.style.cssText = `
          background-color: var(--theme-primary, #00b286);
          color: white;
          border: none;
          border-radius: 8px;
          height: ${isMobile() ? '48px' : '60px'};
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.3s ease;
          flex: 1;  // Make it stretch in both mobile and desktop
          font-size: ${isMobile() ? '16px' : '16px'};
        `;
  
        addButton.addEventListener('mouseover', () => addButton.style.opacity = '0.9');
        addButton.addEventListener('mouseout', () => addButton.style.opacity = '1');
        addButton.addEventListener('click', () => {
          const originalSelect = document.querySelector('select#product-quantity');
          if (originalSelect) {
            originalSelect.value = quantityInput.value;
            const event = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(event);
          }
      
          const originalButton = document.querySelector('.btn.btn-add-to-cart');
          if (originalButton) {
            setTimeout(() => {
              originalButton.click();
            }, 100);
          }
        });
  
        // Assemble the quantity section
        quantityWrapper.appendChild(decreaseBtn);
        quantityWrapper.appendChild(quantityInput);
        quantityWrapper.appendChild(increaseBtn);
        quantityContainer.appendChild(quantityLabel);
        quantityContainer.appendChild(quantityWrapper);
      
        // Assemble the final structure
        wrapper.appendChild(quantityContainer);
        wrapper.appendChild(addButton);
        container.appendChild(wrapper);
        document.body.appendChild(container);
      
        this.stickyCartElement = container;
        // Add scroll event listener
        window.addEventListener('scroll', () => {
          const originalButton = document.querySelector('.btn.btn-add-to-cart');
          const originalSelect = document.querySelector('select#product-quantity');
          
          if (!originalButton) return;
      
          const buttonRect = originalButton.getBoundingClientRect();
          const isButtonVisible = buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight;
          
          if (!isButtonVisible) {
            container.style.display = 'block';
            if (originalSelect) {
              quantityInput.value = originalSelect.value;
            }
          } else {
            container.style.display = 'none';
          }
        });
      },
  
      findActiveCampaignForProduct(productId) {
        const now = new Date();
        const activeCampaign = this.campaigns.find(campaign => {
          if (!campaign.products || !Array.isArray(campaign.products)) {
            return false;
          }
  
          const hasProduct = campaign.products.some(p => p.id === productId);
          
          let endTime;
          try {
            endTime = campaign.endTime?._seconds ? 
              new Date(campaign.endTime._seconds * 1000) :
              new Date(campaign.endTime.seconds * 1000);
          } catch (error) {
            return false;
          }
  
          if (!(endTime instanceof Date && !isNaN(endTime))) {
            return false;
          }
  
          if (hasProduct && !this.originalDurations.has(campaign.id)) {
            const startTime = campaign.startTime?._seconds ? 
              new Date(campaign.startTime._seconds * 1000) :
              new Date(campaign.startTime.seconds * 1000);
            
            const duration = endTime - startTime;
            this.originalDurations.set(campaign.id, duration);
          }
  
          const isNotEnded = now <= endTime || campaign.timerSettings.autoRestart;
          const isActive = campaign.status === 'active';
  
          return hasProduct && isNotEnded && isActive;
        });
  
        return activeCampaign;
      },
  
      createCountdownTimer(campaign, productId) {
        const existingTimer = document.getElementById(`hmstudio-countdown-${productId}`);
        if (existingTimer) {
          existingTimer.remove();
          if (this.activeTimers.has(productId)) {
            clearInterval(this.activeTimers.get(productId));
            this.activeTimers.delete(productId);
          }
        }
  
        const container = document.createElement('div');
        container.id = `hmstudio-countdown-${productId}`;
        container.style.cssText = `
          background: ${campaign.timerSettings.backgroundColor};
          color: ${campaign.timerSettings.textColor};
          padding: ${isMobile() ? '8px 10px' : '12px 15px'};
          margin: ${isMobile() ? '10px 0' : '15px 0'};
          border-radius: 8px;
          text-align: center;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${isMobile() ? '8px' : '12px'};
          font-size: ${isMobile() ? '12px' : '14px'};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          flex-wrap: ${isMobile() ? 'wrap' : 'nowrap'};
          width: ${isMobile() ? '100%' : 'auto'};
        `;
  
        const textElement = document.createElement('span');
        const timerText = getCurrentLanguage() === 'ar' ? 
          campaign.timerSettings.textAr : 
          campaign.timerSettings.textEn;
        textElement.textContent = timerText;
        textElement.style.cssText = `
          font-weight: 500;
          ${isMobile() ? 'width: 100%; margin-bottom: 4px;' : ''}
        `;
          
        const timeElement = document.createElement('div');
        timeElement.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.15);
          ${isMobile() ? 'width: 100%; justify-content: center;' : ''}
        `;
  
        container.appendChild(textElement);
        container.appendChild(timeElement);
  
        let endTime = campaign.endTime?._seconds ? 
          new Date(campaign.endTime._seconds * 1000) :
          new Date(campaign.endTime.seconds * 1000);
  
        this.activeTimers.set(productId, {
          element: timeElement,
          endTime: endTime,
          campaign: campaign,
          originalDuration: this.originalDurations.get(campaign.id)
        });
  
        return container;
      },
  
      createProductCardTimer(campaign, productId) {
        const existingTimer = document.getElementById(`hmstudio-card-countdown-${productId}`);
        if (existingTimer) {
          return existingTimer;
        }
  
        const container = document.createElement('div');
        container.id = `hmstudio-card-countdown-${productId}`;
        container.style.cssText = `
          background: ${campaign.timerSettings.backgroundColor};
          color: ${campaign.timerSettings.textColor};
          padding: 4px;
          margin-top: 30px !important;
          border-bottom-right-radius: 8px;
          border-bottom-left-radius: 8px;
          text-align: center;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: ${isMobile() ? '10px' : '12px'};
          width: 100%;
          overflow: hidden;
        `;
  
        const timeElement = document.createElement('div');
        timeElement.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: ${isMobile() ? '2px' : '4px'};
        `;
  
        container.appendChild(timeElement);
  
        let endTime = campaign.endTime?._seconds ? 
          new Date(campaign.endTime._seconds * 1000) :
          new Date(campaign.endTime.seconds * 1000);
  
        const startTime = campaign.startTime?._seconds ? 
          new Date(campaign.startTime._seconds * 1000) :
          new Date(campaign.startTime.seconds * 1000);
  
        const originalDuration = endTime - startTime;
  
        this.activeTimers.set(`card-${productId}`, {
          element: timeElement,
          endTime: endTime,
          campaign: campaign,
          originalDuration: originalDuration,
          isFlashing: false
        });
  
        return container;
      },
  
      // Add keyframes for flashing animation
      addFlashingStyleIfNeeded() {
        if (!document.getElementById('countdown-flash-animation')) {
          const style = document.createElement('style');
          style.id = 'countdown-flash-animation';
          style.textContent = `
            @keyframes countdown-flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
            .countdown-flash {
              animation: countdown-flash 1s ease-in-out infinite;
            }
          `;
          document.head.appendChild(style);
        }
      },
  
      updateAllTimers() {
        this.addFlashingStyleIfNeeded();
        const now = new Date();
        
        this.activeTimers.forEach((timer, id) => {
          if (!timer.element || !timer.endTime) return;
  
          let timeDiff = timer.endTime - now;
  
          // Handle auto-restart
          if (timeDiff <= 0 && timer.campaign?.timerSettings?.autoRestart && timer.originalDuration) {
            const newEndTime = new Date(now.getTime() + timer.originalDuration);
            timer.endTime = newEndTime;
            timeDiff = timer.originalDuration;
            timer.isFlashing = false;
            console.log(`Timer restarted for ${id}, new end time:`, newEndTime);
          } else if (timeDiff <= 0 && !timer.campaign?.timerSettings?.autoRestart) {
            const elementId = id.startsWith('card-') ? 
              `hmstudio-card-countdown-${id.replace('card-', '')}` :
              `hmstudio-countdown-${id}`;
            const element = document.getElementById(elementId);
            if (element) element.remove();
            this.activeTimers.delete(id);
            return;
          }
  
          // Check if we're in the last 5 minutes
          const isLastFiveMinutes = timeDiff <= 300000; // 5 minutes in milliseconds
  
          // Update flashing state if needed
          if (isLastFiveMinutes && !timer.isFlashing) {
            timer.isFlashing = true;
          } else if (!isLastFiveMinutes && timer.isFlashing) {
            timer.isFlashing = false;
          }
  
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
          // Always include all time units
          const timeUnits = [
            {
              value: days,
              label: getCurrentLanguage() === 'ar' ? 'ي' : 'd'
            },
            {
              value: hours,
              label: getCurrentLanguage() === 'ar' ? 'س' : 'h'
            },
            {
              value: minutes,
              label: getCurrentLanguage() === 'ar' ? 'د' : 'm'
            },
            {
              value: seconds,
              label: getCurrentLanguage() === 'ar' ? 'ث' : 's'
            }
          ];
  
          const isCard = id.startsWith('card-');
          const scale = isCard ? (isMobile() ? 0.85 : 1) : 1;
          
          let html = `
            <div class="countdown-units-wrapper ${timer.isFlashing ? 'countdown-flash' : ''}" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: ${isCard ? '2px' : '4px'};
              transform: scale(${scale});
              flex-wrap: ${isCard ? 'wrap' : 'nowrap'};
              ${isCard ? 'max-width: 100%; padding: 2px;' : ''}
            ">
          `;
  
          timeUnits.forEach((unit, index) => {
            html += `
              <div class="hmstudio-countdown-unit" style="
                display: inline-flex;
                align-items: center;
                white-space: nowrap;
                gap: ${isCard ? '1px' : '2px'};
                ${index < timeUnits.length - 1 ? `margin-${getCurrentLanguage() === 'ar' ? 'left' : 'right'}: ${isCard ? '2px' : '4px'};` : ''}
                ${isCard && index % 2 === 1 ? 'margin-right: 8px;' : ''}
              ">
                <span style="
                  font-weight: bold;
                  min-width: ${isCard ? '14px' : '20px'};
                  text-align: center;
                  font-size: ${isCard ? (isMobile() ? '11px' : '12px') : (isMobile() ? '12px' : '14px')};
                ">${String(unit.value).padStart(2, '0')}</span>
                <span style="
                  font-size: ${isCard ? (isMobile() ? '9px' : '10px') : (isMobile() ? '10px' : '12px')};
                  opacity: 0.8;
                ">${unit.label}</span>
                ${index < timeUnits.length - 1 ? `
                  <span style="
                    margin-${getCurrentLanguage() === 'ar' ? 'right' : 'left'}: ${isCard ? '2px' : '4px'};
                    opacity: 0.8;
                  ">:</span>
                ` : ''}
              </div>
            `;
          });
  
          html += '</div>';
          timer.element.innerHTML = html;
        });
      },
  
      setupProductCardTimers() {
        const productCards = document.querySelectorAll('.product-item');
        const processedCards = new Set();
        
        productCards.forEach(card => {
          let productId = null;
          const wishlistBtn = card.querySelector('[data-wishlist-id]');
          if (wishlistBtn) {
            productId = wishlistBtn.getAttribute('data-wishlist-id');
          }
  
          if (productId && !processedCards.has(productId)) {
            processedCards.add(productId);
            const activeCampaign = this.findActiveCampaignForProduct(productId);
            if (activeCampaign) {
              const timer = this.createProductCardTimer(activeCampaign, productId);
              const imageContainer = card.querySelector('.content');
              if (imageContainer && !document.getElementById(`hmstudio-card-countdown-${productId}`)) {
                imageContainer.parentNode.insertBefore(timer, imageContainer.nextSibling);
              }
            }
          }
        });
      },
  
      setupProductTimer() {
        console.log('Setting up product timer...');
  
        let productId;
        const wishlistBtn = document.querySelector('[data-wishlist-id]');
        if (wishlistBtn) {
          productId = wishlistBtn.getAttribute('data-wishlist-id');
        }
  
        if (!productId) {
          const productForm = document.querySelector('form[data-product-id]');
          if (productForm) {
            productId = productForm.getAttribute('data-product-id');
          }
        }
  
        if (!productId) {
          return;
        }
  
        this.currentProductId = productId;
        const activeCampaign = this.findActiveCampaignForProduct(productId);
  
        if (!activeCampaign) {
          return;
        }
  
        const timer = this.createCountdownTimer(activeCampaign, productId);
  
        const priceSelectors = [
          'h2.product-formatted-price.theme-text-primary',
          '.product-formatted-price',
          '.product-formatted-price.theme-text-primary',
          '.product-price',
          'h2.theme-text-primary',
          '.theme-text-primary'
        ];
  
        let inserted = false;
        for (const selector of priceSelectors) {
          const priceContainer = document.querySelector(selector);
          
          if (priceContainer?.parentElement) {
            priceContainer.parentElement.insertBefore(timer, priceContainer);
            inserted = true;
            break;
          }
        }
  
        if (!inserted) {
          const productDetails = document.querySelector('.products-details');
          if (productDetails) {
            productDetails.insertBefore(timer, productDetails.firstChild);
          }
        }
  
        // Create sticky cart after setting up timer
        this.createStickyCart();
      },
  
      startTimerUpdates() {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateAllTimers(), 1000);
      },
  
      stopTimerUpdates() {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
      },
  
      initialize() {
        console.log('Initializing Smart Cart with campaigns:', this.campaigns);
        
        this.stopTimerUpdates();
        
        if (document.querySelector('.product.products-details-page')) {
          console.log('On product page');
          // Create sticky cart regardless of campaigns
          this.createStickyCart();
  
          // Setup timer if there's an active campaign
          const wishlistBtn = document.querySelector('[data-wishlist-id]');
          const productForm = document.querySelector('form[data-product-id]');
          const productId = wishlistBtn?.getAttribute('data-wishlist-id') || 
                         productForm?.getAttribute('data-product-id');
  
          if (productId) {
            const activeCampaign = this.findActiveCampaignForProduct(productId);
            if (activeCampaign) {
              this.setupProductTimer();
              if (this.activeTimers.size > 0) {
                this.startTimerUpdates();
              }
            }
          }
  
          const observer = new MutationObserver((mutations) => {
            // Check if sticky cart needs to be recreated
            if (!document.getElementById('hmstudio-sticky-cart')) {
              this.createStickyCart();
            }
  
            // Check if timer needs to be updated (only if there's an active campaign)
            if (this.currentProductId && !document.getElementById(`hmstudio-countdown-${this.currentProductId}`)) {
              const activeCampaign = this.findActiveCampaignForProduct(this.currentProductId);
              if (activeCampaign) {
                this.setupProductTimer();
                if (this.activeTimers.size > 0 && !this.updateInterval) {
                  this.startTimerUpdates();
                }
              }
            }
          });
  
          observer.observe(document.body, { childList: true, subtree: true });
        } else if (document.querySelector('.product-item')) {
          console.log('On product listing page, setting up card timers');
          this.setupProductCardTimers();
  
          if (this.activeTimers.size > 0) {
            this.startTimerUpdates();
          }
  
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length) {
                this.setupProductCardTimers();
                if (this.activeTimers.size > 0 && !this.updateInterval) {
                  this.startTimerUpdates();
                }
              }
            });
          });
  
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    };
  
    window.addEventListener('beforeunload', () => {
      SmartCart.stopTimerUpdates();
    });
  
    // Handle mobile viewport changes
    window.addEventListener('resize', () => {
      if (SmartCart.stickyCartElement) {
        SmartCart.createStickyCart(); // Recreate sticky cart with updated mobile styles
      }
    });
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => SmartCart.initialize());
    } else {
      SmartCart.initialize();
    }
  })();
    // =============== SLIDING CART FEATURE ===============
    // src/scripts/slidingCart.js
// HMStudio Sliding Cart v1.3.9
;(() => {
    console.log("Sliding Cart script initialized")
  
    
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript
      const scriptUrl = new URL(scriptTag.src)
      const storeId = scriptUrl.searchParams.get("storeId")
      return storeId ? storeId.split("?")[0] : null
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || "ar"
    }
  
    const storeId = getStoreIdFromUrl()
    if (!storeId) {
      console.error("Store ID not found in script URL")
      return
    }
  
  // Add keyframe animation for spinner
  const styleSheet = document.createElement("style")
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(styleSheet)
  
  // Coupon feedback messages
  const couponMessages = {
    invalidCoupon: {
      ar: "القسيمة غير صالحة",
      en: "Invalid coupon code",
    },
    expiredCoupon: {
      ar: "انتهت صلاحية القسيمة",
      en: "Coupon has expired",
    },
    productNotEligible: {
      ar: "هذه القسيمة غير متوفرة للمنتجات المختارة",
      en: "This coupon is not available for the selected products",
    },
    minimumNotMet: {
      ar: "لم يتم الوصول إلى الحد الأدنى للطلب",
      en: "Minimum order amount not met",
    },
    alreadyUsed: {
      ar: "تم استخدام هذه القسيمة من قبل",
      en: "This coupon has already been used",
    },
    success: {
      ar: "تم تطبيق القسيمة بنجاح",
      en: "Coupon applied successfully",
    },
  }
  
    const SlidingCart = {
      cartElement: null,
      isOpen: false,
  
      fetchSettings: async () => {
        try {
          const response = await fetch(
            `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getSlidingCartSettings?storeId=${storeId}`,
          )
          if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.statusText}`)
          }
          const data = await response.json()
          console.log("Fetched sliding cart settings:", data)
          return data
        } catch (error) {
          console.error("Error fetching sliding cart settings:", error)
          return null
        }
      },
  
      createCartStructure: function () {
        const currentLang = getCurrentLanguage()
        const isRTL = currentLang === "ar"
  
        // Create cart container
        const container = document.createElement("div")
        container.id = "hmstudio-sliding-cart"
        container.className = "hmstudio-cart-container"
        container.style.cssText = `
          position: fixed;
          top: 0;
          ${isRTL ? "right" : "left"}: 100%;
          width: 400px;
          height: 100vh;
          background: #fff;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          transition: transform 300ms ease;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          direction: ${isRTL ? "rtl" : "ltr"};
        `
  
        // Create header
        const header = document.createElement("div")
        header.className = "hmstudio-cart-header"
        header.style.cssText = `
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        `
  
        const title = document.createElement("h2")
        title.className = "hmstudio-cart-title"
        title.textContent = currentLang === "ar" ? "سلة التسوق" : "Shopping Cart"
        title.style.cssText = `
          margin: 0;
          font-size: 1.25rem;
          font-weight: bold;
        `
  
        const closeButton = document.createElement("button")
        closeButton.className = "hmstudio-cart-close"
        closeButton.innerHTML = "✕"
        closeButton.style.cssText = `
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 5px;
          opacity: 0.6;
          transition: opacity 0.3s;
        `
        closeButton.addEventListener("mouseover", () => (closeButton.style.opacity = "1"))
        closeButton.addEventListener("mouseout", () => (closeButton.style.opacity = "0.6"))
        closeButton.addEventListener("click", () => this.closeCart())
  
        header.appendChild(title)
        header.appendChild(closeButton)
  
        // Create content area
        const content = document.createElement("div")
        content.className = "hmstudio-cart-content"
        content.style.cssText = `
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        `
  
        // Create footer
        const footer = document.createElement("div")
        footer.className = "hmstudio-cart-footer"
        footer.style.cssText = `
          padding: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        `
  
        // Assemble cart structure
        container.appendChild(header)
        container.appendChild(content)
        container.appendChild(footer)
  
        // Create backdrop
        const backdrop = document.createElement("div")
        backdrop.id = "hmstudio-sliding-cart-backdrop"
        backdrop.className = "hmstudio-cart-backdrop"
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: opacity 300ms ease;
          z-index: 999998;
        `
  
        backdrop.addEventListener("click", () => this.closeCart())
  
        // Add to DOM
        document.body.appendChild(backdrop)
        document.body.appendChild(container)
  
        this.cartElement = {
          container,
          content,
          footer,
          backdrop,
        }
  
        return this.cartElement
      },
      fetchCartData: async () => {
        try {
          const response = await zid.store.cart.fetch()
          if (response.status === "success") {
            return response.data.cart
          }
          throw new Error("Failed to fetch cart data")
        } catch (error) {
          console.error("Error fetching cart:", error)
          return null
        }
      },
  
      updateItemQuantity: async function (cartProductId, productId, newQuantity) {
        try {
          await zid.store.cart.updateProduct(cartProductId, newQuantity, productId)
          await this.updateCartDisplay()
        } catch (error) {
          console.error("Error updating quantity:", error)
        }
      },
  
      removeItem: async function (cartProductId, productId) {
        try {
          await zid.store.cart.removeProduct(cartProductId, productId)
          await this.updateCartDisplay()
        } catch (error) {
          console.error("Error removing item:", error)
        }
      },
  
      createCartItem: function (item, currentLang) {
        const isArabic = currentLang === "ar"
        //const currencySymbol = ' ر.س ';
  
        const itemElement = document.createElement("div")
        itemElement.className = "hmstudio-cart-item"
        itemElement.style.cssText = `
          display: flex;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          direction: ${isArabic ? "rtl" : "ltr"};
        `
  
        // Product image
        const imageElement = document.createElement("img")
        imageElement.className = "hmstudio-cart-item-image"
        imageElement.src = item.images?.[0]?.origin || item.images?.[0]?.thumbnail || "/path/to/default-image.jpg"
        imageElement.alt = item.name || ""
        imageElement.style.cssText = `
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
        `
  
        // Product details container
        const details = document.createElement("div")
        details.className = "hmstudio-cart-item-details"
        details.style.cssText = `
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        `
  
        // Product name
        const name = document.createElement("h3")
        name.className = "hmstudio-cart-item-name"
        name.textContent = item.name || ""
        name.style.cssText = `
          margin: 0;
          font-size: 0.9rem;
          font-weight: 500;
        `
  
        // Price container
        const priceContainer = document.createElement("div")
        priceContainer.className = "hmstudio-cart-item-price-container"
        priceContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          flex-direction: ${isArabic ? "row-reverse" : "row"};
        `
  
        if (item.gross_sale_price && item.gross_price !== item.gross_sale_price) {
          // Sale price (current price)
          const salePrice = document.createElement("div")
          salePrice.className = "hmstudio-cart-item-sale-price"
          const formattedSalePrice = isArabic
            ? `${item.gross_sale_price.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
            : `${currentLang === "en" ? "SAR" : "ر.س"} ${item.gross_sale_price.toFixed(2)}`
          salePrice.textContent = formattedSalePrice
          salePrice.style.cssText = `
            font-weight: bold;
            color: var(--theme-primary, #00b286);
          `
  
          // Original price
          const originalPrice = document.createElement("div")
          originalPrice.className = "hmstudio-cart-item-original-price"
          const formattedOriginalPrice = isArabic
            ? `${item.gross_price.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
            : `${currentLang === "en" ? "SAR" : "ر.س"} ${item.gross_price.toFixed(2)}`
          originalPrice.textContent = formattedOriginalPrice
          originalPrice.style.cssText = `
            text-decoration: line-through;
            color: #999;
            font-size: 0.9em;
            margin-${isArabic ? "left" : "right"}: 8px;
          `
  
          if (isArabic) {
            priceContainer.appendChild(originalPrice)
            priceContainer.appendChild(salePrice)
          } else {
            priceContainer.appendChild(salePrice)
            priceContainer.appendChild(originalPrice)
          }
        } else {
          // Regular price only
          const price = document.createElement("div")
          price.className = "hmstudio-cart-item-price"
          const priceValue = item.gross_price || item.price
          const formattedPrice = isArabic
            ? `${priceValue.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
            : `${currentLang === "en" ? "SAR" : "ر.س"} ${priceValue.toFixed(2)}`
          price.textContent = formattedPrice
          price.style.cssText = `
            font-weight: bold;
            color: var(--theme-primary, #00b286);
          `
          priceContainer.appendChild(price)
        }
  
        // Quantity controls
        const quantityControls = document.createElement("div")
        quantityControls.className = "hmstudio-cart-item-quantity"
        quantityControls.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
        `
  
        const createButton = (text, onClick) => {
          const btn = document.createElement("button")
          btn.className = `hmstudio-cart-quantity-${text === "+" ? "increase" : "decrease"}`
          btn.textContent = text
          btn.style.cssText = `
            width: 24px;
            height: 24px;
            padding: 0;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.3s;
          `
          btn.addEventListener("mouseover", () => {
            btn.style.backgroundColor = "#f0f0f0"
          })
          btn.addEventListener("mouseout", () => {
            btn.style.backgroundColor = "transparent"
          })
          btn.addEventListener("click", onClick.bind(this))
          return btn
        }
  
        const decreaseBtn = createButton("-", () => {
          if (item.quantity > 1) {
            this.updateItemQuantity(item.id, item.product_id, item.quantity - 1)
          }
        })
  
        const quantity = document.createElement("span")
        quantity.className = "hmstudio-cart-quantity-value"
        quantity.textContent = item.quantity
        quantity.style.cssText = `
          min-width: 20px;
          text-align: center;
        `
  
        const increaseBtn = createButton("+", () => {
          this.updateItemQuantity(item.id, item.product_id, item.quantity + 1)
        })
  
        // Remove button
        const removeBtn = document.createElement("button")
        removeBtn.className = "hmstudio-cart-item-remove"
        removeBtn.innerHTML = "🗑️"
        removeBtn.style.cssText = `
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          margin-${isArabic ? "right" : "left"}: auto;
          font-size: 1.2rem;
          opacity: 0.7;
          transition: opacity 0.3s;
        `
        removeBtn.addEventListener("mouseover", () => {
          removeBtn.style.opacity = "1"
        })
        removeBtn.addEventListener("mouseout", () => {
          removeBtn.style.opacity = "0.7"
        })
        removeBtn.addEventListener("click", () => {
          this.removeItem(item.id, item.product_id)
        })
  
        // Assemble quantity controls
        quantityControls.appendChild(decreaseBtn)
        quantityControls.appendChild(quantity)
        quantityControls.appendChild(increaseBtn)
  
        // Assemble details
        details.appendChild(name)
        details.appendChild(priceContainer)
        details.appendChild(quantityControls)
  
        // Assemble item
        itemElement.appendChild(imageElement)
        itemElement.appendChild(details)
        itemElement.appendChild(removeBtn)
  
        return itemElement
      },
      createFooterContent: function (cartData, currentLang) {
        const isArabic = currentLang === "ar"
        //const currencySymbol = ' ر.س ';
        const currencySymbol = currentLang === "en" ? "SAR" : "ر.س"
        
  
        const footer = document.createElement("div")
        footer.className = "hmstudio-cart-footer-content"
        footer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 15px;
          direction: ${isArabic ? "rtl" : "ltr"};
        `
  
        function getErrorType(response) {
          // Log the full response for debugging
          console.log("Coupon response:", response)
  
          // Check the error message from the response data
          const errorMessage = (response.data?.message || "").toLowerCase()
  
          // Check for specific error conditions with their Arabic messages
          if (
            errorMessage.includes("فترة إستخدام الكوبون لم تبدأ بعد أو أنها انتهت") || // New expired message
            errorMessage.includes("لم تبدأ بعد أو أنها انتهت") || // Partial match
            errorMessage.includes("منتهية الصلاحية") ||
            errorMessage.includes("expired")
          ) {
            return "expiredCoupon"
          }
  
          if (
            errorMessage.includes("قيمة منتجات") ||
            errorMessage.includes("حد أدنى") ||
            errorMessage.includes("200.00") ||
            errorMessage.includes("يتطلب حد")
          ) {
            return "minimumNotMet"
          }
  
          if (
            errorMessage.includes("السلة لا تحتوي أي منتج من المنتجات المشمولة") ||
            errorMessage.includes("not eligible") ||
            errorMessage.includes("not applicable")
          ) {
            return "productNotEligible"
          }
  
          if (
            errorMessage.includes("تم استخدام") ||
            errorMessage.includes("مستخدمة مسبقا") ||
            errorMessage.includes("already used") ||
            errorMessage.includes("used before")
          ) {
            return "alreadyUsed"
          }
  
          // If none of the above conditions match
          return "invalidCoupon"
        }
  
        // Coupon Section
        const couponSection = document.createElement("div")
        couponSection.className = "hmstudio-cart-coupon-section"
        couponSection.style.cssText = `
          padding: 15px 0;
        `
  
        const couponForm = document.createElement("form")
        couponForm.className = "hmstudio-cart-coupon-form"
        couponForm.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 10px;
        `
  
        // Prevent form submission
        couponForm.addEventListener("submit", (e) => {
          e.preventDefault()
        })
  
        // Add message container for coupon feedback
        const couponMessage = document.createElement("div")
        couponMessage.className = "hmstudio-cart-coupon-message"
        couponMessage.style.cssText = `
          font-size: 0.9rem;
          display: none;
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 8px;
        `
  
        const inputContainer = document.createElement("div")
        inputContainer.className = "hmstudio-cart-coupon-input-container"
        inputContainer.style.cssText = `
          display: flex;
          gap: 10px;
        `
  
        const couponInput = document.createElement("input")
        couponInput.className = "hmstudio-cart-coupon-input"
        couponInput.type = "text"
        couponInput.placeholder = isArabic ? "أدخل رمز القسيمة" : "Enter coupon code"
        couponInput.style.cssText = `
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          font-size: 0.9rem;
          transition: border-color 0.3s;
        `
  
        // Add event listener for Enter key
        couponInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            applyButton.click()
          }
        })
  
        couponInput.addEventListener("focus", () => {
          couponInput.style.borderColor = "var(--theme-primary, #00b286)"
        })
  
        couponInput.addEventListener("blur", () => {
          couponInput.style.borderColor = "rgba(0, 0, 0, 0.1)"
        })
  
        function showCouponMessage(type, isArabic) {
          const message = couponMessages[type][isArabic ? "ar" : "en"]
          couponMessage.style.display = "block"
          couponMessage.textContent = message
  
          if (type === "success") {
            couponMessage.style.cssText = `
              display: block;
              padding: 8px 12px;
              border-radius: 4px;
              margin-top: 8px;
              background-color: rgba(0, 178, 134, 0.1);
              color: var(--theme-primary, #00b286);
            `
            couponInput.value = ""
          } else {
            couponMessage.style.cssText = `
              display: block;
              padding: 8px 12px;
              border-radius: 4px;
              margin-top: 8px;
              background-color: rgba(220, 53, 69, 0.1);
              color: #dc3545;
            `
          }
        }
  
        // Apply button with spinner
        const applyButton = document.createElement("button")
        applyButton.className = "hmstudio-cart-coupon-apply"
        applyButton.type = "button"
        applyButton.style.cssText = `
          padding: 8px 16px;
          background: var(--theme-primary, #00b286);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 80px;
          justify-content: center;
          transition: opacity 0.3s, background-color 0.3s;
        `
  
        applyButton.addEventListener("mouseover", () => {
          if (!applyButton.disabled) {
            applyButton.style.opacity = "0.9"
          }
        })
  
        applyButton.addEventListener("mouseout", () => {
          if (!applyButton.disabled) {
            applyButton.style.opacity = "1"
          }
        })
  
        const spinner = document.createElement("div")
        spinner.className = "hmstudio-cart-coupon-spinner"
        spinner.style.cssText = `
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: none;
        `
  
        const buttonText = document.createElement("span")
        buttonText.className = "hmstudio-cart-coupon-button-text"
        buttonText.textContent = isArabic ? "تطبيق" : "Apply"
  
        applyButton.appendChild(spinner)
        applyButton.appendChild(buttonText)
  
        // Handle coupon application
        applyButton.addEventListener("click", async () => {
          const couponCode = couponInput.value.trim()
          if (!couponCode) return
  
          // Show spinner, disable input and button
          spinner.style.display = "block"
          couponInput.disabled = true
          applyButton.disabled = true
          buttonText.style.opacity = "0.7"
  
          try {
            const response = await zid.store.cart.redeemCoupon(couponCode)
            console.log("Coupon application response:", response)
  
            if (response.status === "success") {
              showCouponMessage("success", isArabic)
              this.updateCartDisplay()
            } else {
              const errorType = getErrorType(response)
              showCouponMessage(errorType, isArabic)
            }
          } catch (error) {
            console.error("Coupon error:", error)
            const errorResponse = {
              data: { message: error.message || "" },
              status: "error",
            }
            const errorType = getErrorType(errorResponse)
            showCouponMessage(errorType, isArabic)
          } finally {
            // Hide spinner, enable input and button
            spinner.style.display = "none"
            couponInput.disabled = false
            applyButton.disabled = false
            buttonText.style.opacity = "1"
          }
        })
  
        inputContainer.appendChild(couponInput)
        inputContainer.appendChild(applyButton)
        couponForm.appendChild(inputContainer)
        couponForm.appendChild(couponMessage)
        couponSection.appendChild(couponForm)
        // Applied Coupon Display (if exists)
        if (cartData.coupon) {
          const appliedCouponContainer = document.createElement("div")
          appliedCouponContainer.className = "hmstudio-cart-applied-coupon"
          appliedCouponContainer.style.cssText = `
            margin-top: 10px;
            padding: 12px;
            background-color: rgba(0, 178, 134, 0.1);
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `
  
          const couponInfo = document.createElement("div")
          couponInfo.className = "hmstudio-cart-coupon-info"
          couponInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
          `
  
          const couponTitle = document.createElement("span")
          couponTitle.className = "hmstudio-cart-coupon-title"
          couponTitle.textContent = isArabic ? "القسيمة المطبقة:" : "Applied Coupon:"
          couponTitle.style.cssText = `
            font-size: 0.8rem;
            color: #666;
          `
  
          const couponCode = document.createElement("span")
          couponCode.className = "hmstudio-cart-coupon-code"
          couponCode.textContent = cartData.coupon.code
          couponCode.style.cssText = `
            font-weight: 500;
            color: var(--theme-primary, #00b286);
          `
  
          const removeButton = document.createElement("button")
          removeButton.className = "hmstudio-cart-coupon-remove"
          removeButton.innerHTML = "✕"
          removeButton.style.cssText = `
            border: none;
            background: none;
            color: #666;
            cursor: pointer;
            padding: 5px;
            font-size: 1.1rem;
            opacity: 0.7;
            transition: opacity 0.3s;
          `
  
          removeButton.addEventListener("mouseover", () => {
            removeButton.style.opacity = "1"
          })
  
          removeButton.addEventListener("mouseout", () => {
            removeButton.style.opacity = "0.7"
          })
  
          removeButton.addEventListener("click", async (e) => {
            e.preventDefault()
            try {
              await zid.store.cart.removeCoupon()
              await this.updateCartDisplay()
            } catch (error) {
              console.error("Error removing coupon:", error)
            }
          })
  
          couponInfo.appendChild(couponTitle)
          couponInfo.appendChild(couponCode)
          appliedCouponContainer.appendChild(couponInfo)
          appliedCouponContainer.appendChild(removeButton)
          couponForm.appendChild(appliedCouponContainer)
        }
  
        // Calculate subtotal using original prices
        const originalSubtotal = cartData.products.reduce((acc, product) => {
          const originalPrice = product.gross_price || product.price
          return acc + originalPrice * product.quantity
        }, 0)
  
        // Subtotal
        const subtotal = document.createElement("div")
        subtotal.className = "hmstudio-cart-subtotal"
        subtotal.style.cssText = `
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 0.9rem;
          margin-top: 15px;
        `
  
        const subTotalFormatted = isArabic
          ? `${originalSubtotal.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${originalSubtotal.toFixed(2)}`
  
        subtotal.innerHTML = `
          <span>${isArabic ? "المجموع الفرعي:" : "Subtotal:"}</span>
          <span>${subTotalFormatted}</span>
        `
  
        footer.appendChild(subtotal)
  
        // Calculate and display total discount (both from product discounts and coupon)
        const calculateTotalDiscount = () => {
          let totalDiscount = 0
  
          // Calculate product discounts
          cartData.products.forEach((product) => {
            if (product.gross_sale_price && product.gross_sale_price !== product.gross_price) {
              const regularPrice = product.gross_price || 0
              const salePrice = product.gross_sale_price || regularPrice
              totalDiscount += (regularPrice - salePrice) * product.quantity
            }
          })
  
          // Add coupon discount if exists
          if (cartData.coupon && cartData.coupon.discount_amount) {
            totalDiscount += Number.parseFloat(cartData.coupon.discount_amount)
          }
  
          return totalDiscount
        }
  
        // Display discount if there's any (either from products or coupon)
        const totalDiscount = calculateTotalDiscount()
        if (totalDiscount > 0 || (cartData.coupon && cartData.coupon.discount_amount > 0)) {
          const discountInfo = document.createElement("div")
          discountInfo.className = "hmstudio-cart-discount-info"
          discountInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            color: var(--theme-primary, #00b286);
            font-size: 0.9rem;
          `
  
          const formattedDiscount = isArabic
            ? `${totalDiscount.toFixed(2)} ${currencySymbol}`
            : `${currencySymbol} ${totalDiscount.toFixed(2)}`
  
          discountInfo.innerHTML = `
            <span>${isArabic ? "قيمة الخصم:" : "Discount:"}</span>
            <span>${formattedDiscount}</span>
          `
  
          footer.appendChild(discountInfo)
        }
  
        // Tax information
        if (cartData.tax_percentage > 0) {
          const taxInfo = document.createElement("div")
          taxInfo.className = "hmstudio-cart-tax-info"
          taxInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 0.9rem;
            padding: 5px 0;
          `
  
          // Calculate tax amount
          const taxAmount = (cartData.products_subtotal * (cartData.tax_percentage / 100)).toFixed(2)
          const formattedTax = isArabic
            ? `${taxAmount} ${currencySymbol} (${cartData.tax_percentage}٪)`
            : `${currencySymbol} ${taxAmount} (${cartData.tax_percentage}%)`
  
          taxInfo.innerHTML = `
            <span>${isArabic ? "الضريبة:" : "Tax:"}</span>
            <span>${formattedTax}</span>
          `
  
          footer.appendChild(taxInfo)
        }
  
        // Total
        const total = document.createElement("div")
        total.className = "hmstudio-cart-total"
        total.style.cssText = `
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 1.1rem;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        `
  
        const formattedTotal = isArabic
          ? `${cartData.total.value.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${cartData.total.value.toFixed(2)}`
  
        total.innerHTML = `
          <span>${isArabic ? "المجموع:" : "Total:"}</span>
          <span>${formattedTotal}</span>
        `
  
        footer.appendChild(total)
  
        // Checkout button
        const checkoutBtn = document.createElement("button")
        checkoutBtn.className = "hmstudio-cart-checkout-button"
        checkoutBtn.textContent = isArabic ? "إتمام الطلب" : "Checkout"
        checkoutBtn.style.cssText = `
         width: 100%;
         padding: 15px;
         background: var(--theme-primary, #00b286);
         color: white;
         border: none;
         border-radius: 4px;
         font-weight: bold;
         cursor: pointer;
         transition: opacity 0.3s;
         margin-top: 15px;
       `
  
        checkoutBtn.addEventListener("mouseover", () => {
          checkoutBtn.style.opacity = "0.9"
        })
  
        checkoutBtn.addEventListener("mouseout", () => {
          checkoutBtn.style.opacity = "1"
        })
  
        checkoutBtn.addEventListener("click", () => {
          // First try to find the direct checkout link (for authenticated users)
          const checkoutLink = document.querySelector('a[href="/checkout/choose-address-and-shipping"]')
  
          if (!checkoutLink || checkoutLink.style.display === "none") {
            // User is not authenticated, create a custom URL that redirects directly to shipping
            const redirectUrl = encodeURIComponent("/checkout/choose-address-and-shipping")
            window.location.href = `/auth/login?redirect_to=${redirectUrl}`
          } else {
            // User is authenticated, use the direct checkout link
            checkoutLink.click()
          }
        })
  
        footer.appendChild(couponSection)
        footer.appendChild(checkoutBtn)
  
        return footer
      },
  
      updateCartDisplay: async function () {
        const cartData = await this.fetchCartData()
        if (!cartData) return
  
        const currentLang = getCurrentLanguage()
        const { content, footer } = this.cartElement
  
        // Update content
        content.innerHTML = ""
  
        if (!cartData.products || cartData.products.length === 0) {
          const emptyMessage = document.createElement("div")
          emptyMessage.className = "hmstudio-cart-empty-message"
          emptyMessage.style.cssText = `
           text-align: center;
           padding: 40px 20px;
           color: rgba(0, 0, 0, 0.5);
         `
          emptyMessage.textContent = currentLang === "ar" ? "سلة التسوق فارغة" : "Your cart is empty"
          content.appendChild(emptyMessage)
  
          // Hide footer when cart is empty
          footer.style.display = "none"
        } else {
          cartData.products.forEach((item) => {
            content.appendChild(this.createCartItem(item, currentLang))
          })
  
          // Show and update footer when cart has items
          footer.style.display = "block"
          footer.innerHTML = ""
          footer.appendChild(this.createFooterContent(cartData, currentLang))
        }
      },
  
      openCart: function () {
        if (this.isOpen) return
  
        const currentLang = getCurrentLanguage()
        const isRTL = currentLang === "ar"
  
        this.cartElement.container.style.transform = `translateX(${isRTL ? "100%" : "-100%"})`
        this.cartElement.backdrop.style.opacity = "1"
        this.cartElement.backdrop.style.visibility = "visible"
        document.body.style.overflow = "hidden"
        this.isOpen = true
  
        this.updateCartDisplay()
      },
  
      closeCart: function () {
        if (!this.isOpen) return
  
        this.cartElement.container.style.transform = "translateX(0)"
        this.cartElement.backdrop.style.opacity = "0"
        this.cartElement.backdrop.style.visibility = "hidden"
        document.body.style.overflow = ""
        this.isOpen = false
      },
  
      handleCartUpdates: function () {
        const self = this
  
        // Check if zid object exists
        if (typeof zid === "undefined" || !zid.store || !zid.store.cart) {
          console.error("Zid store object not found. Waiting for it to be available...")
  
          // Wait for zid object to be available
          const checkZid = setInterval(() => {
            if (typeof zid !== "undefined" && zid.store && zid.store.cart) {
              clearInterval(checkZid)
              initializeCartHandler()
            }
          }, 100)
  
          return
        }
  
        initializeCartHandler()
  
        function initializeCartHandler() {
          const originalAddProduct = zid.store.cart.addProduct
          zid.store.cart.addProduct = async (...args) => {
            try {
              const result = await originalAddProduct.apply(zid.store.cart, args)
              if (result.status === "success") {
                setTimeout(() => {
                  self.openCart()
                  self.updateCartDisplay()
                }, 100)
              }
              return result
            } catch (error) {
              console.error("Error in cart add:", error)
              throw error
            }
          }
        }
      },
  
      setupCartButton: function () {
        
        // Add event listener to the parent header-cart div
        const headerCart = document.querySelector(".header-cart")
        if (headerCart) {
          headerCart.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.openCart()
          })
        }
        const cartButtons = document.querySelectorAll(".a-shopping-cart, .a-shopping-cart")
        cartButtons.forEach((button) => {
          button.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.openCart()
          })
        })
      },
  
      initialize: async function () {
        console.log("Initializing Sliding Cart")
  
        // Fetch settings
        const settings = await this.fetchSettings()
        if (!settings?.enabled) {
          console.log("Sliding Cart is disabled")
          return
        }
  
        // Create cart structure
        this.createCartStructure()
  
        // Wait for document and zid to be ready
        const waitForZid = () => {
          if (typeof zid !== "undefined" && zid.store && zid.store.cart) {
            // Setup cart functionality
            this.handleCartUpdates()
            this.setupCartButton()
  
            // Setup mutation observer for dynamically added cart buttons
            const self = this
            const observer = new MutationObserver(() => {
              self.setupCartButton()
            })
  
            observer.observe(document.body, {
              childList: true,
              subtree: true,
            })
  
            console.log("Sliding Cart initialized successfully")
          } else {
            // If zid is not ready, wait and try again
            setTimeout(waitForZid, 100)
          }
        }
  
        waitForZid()
      },
    }
  
    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        SlidingCart.initialize.call(SlidingCart)
      })
    } else {
      SlidingCart.initialize.call(SlidingCart)
    }
  })();
  })();
