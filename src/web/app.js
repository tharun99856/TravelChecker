document.addEventListener('DOMContentLoaded', async () => {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeEnter = document.getElementById('welcomeEnter');
    if (welcomeEnter && welcomeScreen) {
        welcomeEnter.addEventListener('click', () => {
            welcomeScreen.classList.add('fade-out');
            setTimeout(() => { welcomeScreen.style.display = 'none'; }, 500);
        });
    }

    // Cap to 5 searches per tab so the free API quotas don't burn out
    const MAX_SEARCHES_PER_SESSION = 5;
    let searchesUsed = 0;
    const searchCounter = document.getElementById('searchCounter');
    function updateCounter() {
        if (!searchCounter) return;
        searchCounter.innerHTML = `Searches: <strong>${searchesUsed} / ${MAX_SEARCHES_PER_SESSION}</strong>`;
        const wrap = searchCounter.closest('.status-indicator');
        if (wrap && searchesUsed >= MAX_SEARCHES_PER_SESSION) {
            wrap.classList.add('quota-exhausted');
        }
    }
    updateCounter();

    const form = document.getElementById('routeForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const recommendationPanel = document.getElementById('recommendationPanel');
    const resultsList = document.getElementById('resultsList');
    const sourceSelect = document.getElementById('source');
    const destSelect = document.getElementById('destination');

    // Fetch and populate locations
    try {
        const res = await fetch('/api/locations');
        const locations = await res.json();
        
        // Group by state
        const byState = {};
        locations.forEach(loc => {
            if (!byState[loc.state]) byState[loc.state] = [];
            byState[loc.state].push(loc);
        });

        let optionsHtml = '<option value="" disabled>Select a location</option>';
        for (const [state, locs] of Object.entries(byState)) {
            optionsHtml += `<optgroup label="${state}">`;
            locs.forEach(loc => {
                optionsHtml += `<option value="${loc.name}">${loc.name} ${loc.populationTier === 'metro' ? '🌟' : ''}</option>`;
            });
            optionsHtml += `</optgroup>`;
        }
        
        sourceSelect.innerHTML = optionsHtml;
        destSelect.innerHTML = optionsHtml;
        
        // Set defaults
        sourceSelect.value = 'Hyderabad';
        destSelect.value = 'Vijayawada';
    } catch (e) {
        console.error("Failed to load locations", e);
        sourceSelect.innerHTML = '<option value="Hyderabad">Hyderabad</option>';
        destSelect.innerHTML = '<option value="Vijayawada">Vijayawada</option>';
    }

    // Sliders - Auto-normalize to 100%
    const sliders = [
        { el: document.getElementById('weightPrice'), display: document.getElementById('priceVal'), key: 'price' },
        { el: document.getElementById('weightTime'), display: document.getElementById('timeVal'), key: 'time' },
        { el: document.getElementById('weightComfort'), display: document.getElementById('comfortVal'), key: 'comfort' }
    ];

    // Sync slider displays
    sliders.forEach(slider => {
        slider.el.addEventListener('input', (e) => {
            const total = sliders.reduce((sum, s) => sum + parseInt(s.el.value), 0);
            sliders.forEach(s => {
                const percentage = Math.round((parseInt(s.el.value) / total) * 100);
                s.display.textContent = `${percentage}%`;
            });
        });
    });

    const modeIcons = {
        'flight': '✈️',
        'train': '🚂',
        'bus': '🚌',
        'cab': '🚕',
        'auto': '🛺',
        'bike': '🏍️'
    };

    function formatDuration(mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }

    async function openBookingLink(option, button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'OPENING...';

        try {
            const response = await fetch('/api/book-flight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    searchId: option.details.searchId,
                    clickRef: option.details.clickRef
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            window.open(data.url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Booking link error:', error);
            alert('Could not open booking link. Please run the search again for fresh prices.');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Enforce per-tab search quota
        if (searchesUsed >= MAX_SEARCHES_PER_SESSION) {
            resultsList.innerHTML = `<div class="empty-state quota-message">
                Search limit reached for this session (${MAX_SEARCHES_PER_SESSION}/${MAX_SEARCHES_PER_SESSION}).<br><br>
                This demo runs on free API tiers. Refresh the page or open a new tab to continue.
            </div>`;
            recommendationPanel.classList.add('hidden');
            return;
        }

        const source = document.getElementById('source').value;
        const destination = document.getElementById('destination').value;
        
        // Normalize weights to 0-1
        const rawWeights = {
            price: parseInt(sliders[0].el.value),
            time: parseInt(sliders[1].el.value),
            comfort: parseInt(sliders[2].el.value)
        };
        const totalWeight = rawWeights.price + rawWeights.time + rawWeights.comfort || 1;
        const weights = {
            price: rawWeights.price / totalWeight,
            time: rawWeights.time / totalWeight,
            comfort: rawWeights.comfort / totalWeight
        };

        // UI Loading state
        submitBtn.classList.add('loading');
        submitBtn.querySelector('.btn-text').textContent = 'ANALYZING...';
        recommendationPanel.classList.add('hidden');
        resultsList.innerHTML = '';
        loadingOverlay.classList.remove('hidden');

        try {
            // Call real MCP backend
            const response = await fetch('/api/analyze-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, destination, weights })
            });
            
            // Count this search against the per-tab quota
            searchesUsed += 1;
            updateCounter();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            
            const data = await response.json();
            const { scoredOptions, recommendation, metadata } = data;

            // Render Recommendation
            const topPick = recommendation.topPick;
            document.getElementById('recIcon').textContent = modeIcons[topPick.mode] || '🚗';
            document.getElementById('recName').textContent = topPick.name;
            document.getElementById('recScore').textContent = Math.round(topPick.compositeScore);
            document.getElementById('recFare').textContent = `₹${topPick.fare}`;
            document.getElementById('recTime').textContent = formatDuration(topPick.duration);
            document.getElementById('recDistance').textContent = `${metadata.distanceKm} km`;
            document.getElementById('recReason').textContent = recommendation.explanation;

            // Price Breakdown
            const breakdownDiv = document.getElementById('recBreakdown');
            const breakdownContent = document.getElementById('breakdownContent');
            
            if (topPick.details) {
                let breakdown = '';
                
                // Personal Vehicle Breakdown
                if (topPick.subMode && topPick.subMode.includes('personal')) {
                    breakdown = `
                        <div style="color: #0e9f6e;">✓ Fuel Type: ${topPick.details.fuelType || 'Petrol'}</div>
                        <div style="color: #0e9f6e;">✓ Mileage: ${topPick.details.mileage || 'N/A'} km/L</div>
                        <div style="color: #0e9f6e;">✓ Fuel Price: ₹${topPick.details.fuelPricePerLiter || 'N/A'}/L</div>
                        <div style="color: #0e9f6e;">✓ Fuel Consumed: ${topPick.details.litersConsumed || 'N/A'} liters</div>
                        <div style="color: #d97706; margin-top: 8px; font-size: 11px;">⚠ ${topPick.details.note || 'Excludes maintenance, toll, parking'}</div>
                    `;
                    breakdownDiv.style.display = 'block';
                }
                // Ride-hailing Breakdown
                else if (topPick.details && topPick.details.baseFare) {
                    breakdown = `
                        <div style="color: #2563eb;">→ Base Fare: ₹${topPick.details.baseFare}</div>
                        ${topPick.details.surgeApplied ? `<div style="color: #e12d39;">→ Surge (${topPick.details.surgeReason}): ${topPick.details.multiplier}x</div>` : ''}
                        <div style="color: #0e9f6e;">→ Final Fare: ₹${topPick.fare}</div>
                        ${topPick.fareMin ? `<div style="color: #8b90a0; font-size: 11px; margin-top: 5px;">Range: ₹${topPick.fareMin} - ₹${topPick.fareMax}</div>` : ''}
                    `;
                    breakdownDiv.style.display = 'block';
                }
                // Train/Bus/Flight Breakdown
                else if (topPick.details && topPick.details.source) {
                    breakdown = `
                        <div style="color: #2563eb;">→ Source: ${topPick.details.source}</div>
                        ${topPick.details.class ? `<div style="color: #2563eb;">→ Class: ${topPick.details.class}</div>` : ''}
                        ${topPick.fareMin ? `<div style="color: #8b90a0; font-size: 11px; margin-top: 5px;">Range: ₹${topPick.fareMin} - ₹${topPick.fareMax}</div>` : ''}
                    `;
                    breakdownDiv.style.display = 'block';
                }
                
                breakdownContent.innerHTML = breakdown;
            }

            // Smart Suggestions
            const suggestionText = document.getElementById('suggestionText');
            let suggestion = '';
            
            // Personal vehicle suggestions
            if (topPick.subMode && topPick.subMode.includes('personal')) {
                const ridehailing = scoredOptions.find(o => o.provider === 'Ola' || o.provider === 'Uber');
                if (ridehailing) {
                    const savings = ridehailing.fare - topPick.fare;
                    const savingsPercent = Math.round((savings / ridehailing.fare) * 100);
                    suggestion = `💰 You're saving ₹${savings} (${savingsPercent}%) by using your own vehicle instead of ${ridehailing.provider}! Remember to add toll charges (~₹${Math.round(metadata.distanceKm * 0.5)}) and parking fees for accurate comparison.`;
                }
            }
            // Surge pricing warning
            else if (topPick.details && topPick.details.surgeApplied) {
                suggestion = `⚠️ ${topPick.details.surgeReason} surge is active! Consider waiting 30-60 minutes or try Personal Vehicle option to save ₹${Math.round(topPick.fare * (topPick.details.multiplier - 1))}.`;
            }
            // Train vs Flight
            else if (topPick.mode === 'train') {
                const flight = scoredOptions.find(o => o.mode === 'flight');
                if (flight) {
                    const savings = flight.fare - topPick.fare;
                    const timeExtra = topPick.duration - flight.duration;
                    suggestion = `🚂 Train saves you ₹${savings} compared to flight. Extra ${Math.round(timeExtra/60)}h travel time is great for working remotely or enjoying scenic views!`;
                }
            }
            // Bus value proposition
            else if (topPick.mode === 'bus') {
                suggestion = `🚌 Overnight buses let you save hotel costs (~₹1,500) while traveling. Arrive refreshed and ready for the day!`;
            }
            // Default suggestion
            else {
                suggestion = `✨ This option offers the best value based on your priorities (${Math.round(weights.price*100)}% price, ${Math.round(weights.time*100)}% time, ${Math.round(weights.comfort*100)}% comfort).`;
            }
            
            suggestionText.textContent = suggestion;

            // Render List
            const arrowSvg = '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>';

            // Collapse all variants of the same mode into one card with a
            // "show more" toggle, so users aren't drowned by 9 train rows
            const modeLabels = {
                flight: 'Flights', train: 'Trains', bus: 'Buses',
                cab: 'Cabs', auto: 'Autos', bike: 'Bikes'
            };
            const grouped = {};
            scoredOptions.forEach(o => {
                if (!grouped[o.mode]) grouped[o.mode] = [];
                grouped[o.mode].push(o);
            });
            // Sort modes by best score within each group, descending
            const modeOrder = Object.keys(grouped).sort((a, b) =>
                Math.max(...grouped[b].map(o => o.compositeScore)) -
                Math.max(...grouped[a].map(o => o.compositeScore))
            );

            const renderCardInner = (opt) => {
                const canBook = opt.mode === 'flight' && opt.details && opt.details.searchId && opt.details.clickRef;

                let legsHtml = '';
                if (opt.legs && opt.legs.length > 0) {
                    const parts = [];
                    parts.push(`<span class="leg-city">${opt.legs[0].from}</span>`);
                    for (const leg of opt.legs) {
                        parts.push(`<span class="leg-arrow">${arrowSvg}</span>`);
                        parts.push(`<span class="leg"><span class="leg-mode">${modeIcons[leg.mode] || ''} ${leg.label || leg.mode}</span></span>`);
                        parts.push(`<span class="leg-arrow">${arrowSvg}</span>`);
                        parts.push(`<span class="leg-city">${leg.to}</span>`);
                    }
                    legsHtml = `<div class="card-legs">${parts.join('')}</div>`;
                }

                return { canBook, legsHtml };
            };

            modeOrder.forEach(modeKey => {
                const group = grouped[modeKey].sort((a, b) => b.compositeScore - a.compositeScore);
                const opt = group[0];   // best in group
                const variants = group.slice(1);

                const card = document.createElement('div');
                card.className = 'route-card mode-group';
                const { canBook, legsHtml } = renderCardInner(opt);

                let breakdownHtml = '';
                const d = opt.details || {};

                if (opt.subMode && opt.subMode.includes('personal')) {
                    breakdownHtml = `
                        <div class="card-detail-row"><span class="cdl">Fuel</span><span class="cdv">${d.fuelType || 'Petrol'} @ ₹${d.fuelPricePerLiter || '-'}/L</span></div>
                        <div class="card-detail-row"><span class="cdl">Mileage</span><span class="cdv">${d.mileage || '-'} km/L</span></div>
                        <div class="card-detail-row"><span class="cdl">Consumed</span><span class="cdv">${d.litersConsumed || '-'} L</span></div>
                        <div class="card-detail-note">${d.note || 'Fuel cost only - excludes toll, maintenance, parking'}</div>
                    `;
                } else if (d.baseFare) {
                    breakdownHtml = `
                        <div class="card-detail-row"><span class="cdl">Base fare</span><span class="cdv">₹${d.baseFare}</span></div>
                        ${d.surgeApplied ? `<div class="card-detail-row card-detail-surge"><span class="cdl">Surge (${d.surgeReason})</span><span class="cdv">${d.multiplier}x</span></div>` : ''}
                        <div class="card-detail-row"><span class="cdl">Final fare</span><span class="cdv" style="color:var(--green);font-weight:700;">₹${opt.fare}</span></div>
                        ${opt.fareMin ? `<div class="card-detail-note">Estimated range: ₹${opt.fareMin} - ₹${opt.fareMax}</div>` : ''}
                    `;
                } else if (d.source === 'IRCTC RapidAPI' || d.source === 'mock') {
                    const isLive = d.source === 'IRCTC RapidAPI';
                    breakdownHtml = `
                        <div class="card-detail-row"><span class="cdl">Data</span><span class="cdv">${isLive ? 'Live IRCTC' : 'Estimated (IRCTC quota exhausted)'}</span></div>
                        ${d.trainNo ? `<div class="card-detail-row"><span class="cdl">Train #</span><span class="cdv">${d.trainNo}</span></div>` : ''}
                        ${opt.fareMin ? `<div class="card-detail-note">Range: ₹${opt.fareMin} - ₹${opt.fareMax}</div>` : ''}
                    `;
                } else if (d.source === 'Travelpayouts') {
                    breakdownHtml = `
                        <div class="card-detail-row"><span class="cdl">Data</span><span class="cdv">Live Travelpayouts</span></div>
                        ${d.airline ? `<div class="card-detail-row"><span class="cdl">Airline</span><span class="cdv">${d.airline}</span></div>` : ''}
                        ${d.flightNo ? `<div class="card-detail-row"><span class="cdl">Flight</span><span class="cdv">${d.flightNo}</span></div>` : ''}
                        ${d.stops !== undefined ? `<div class="card-detail-row"><span class="cdl">Stops</span><span class="cdv">${d.stops === 0 ? 'Non-stop' : d.stops + ' stop(s)'}</span></div>` : ''}
                    `;
                } else {
                    const label = d.source === 'mock'
                        ? 'Estimated (modeled on real pricing bands)'
                        : (d.source || 'Estimate');
                    breakdownHtml = `
                        <div class="card-detail-row"><span class="cdl">Data</span><span class="cdv">${label}</span></div>
                        ${opt.fareMin ? `<div class="card-detail-note">Range: ₹${opt.fareMin} - ₹${opt.fareMax}</div>` : ''}
                    `;
                }

                let insightHtml = '';

                if (opt.subMode && opt.subMode.includes('personal')) {
                    const ridehailing = scoredOptions.find(o => o.provider === 'Ola' || o.provider === 'Uber');
                    if (ridehailing) {
                        const savings = ridehailing.fare - opt.fare;
                        if (savings > 0) {
                            insightHtml = `<div class="card-insight">Saves ₹${savings} vs ${ridehailing.provider}. Add toll (~₹${Math.round(metadata.distanceKm * 0.5)}) for full cost.</div>`;
                        }
                    }
                } else if (d.surgeApplied) {
                    insightHtml = `<div class="card-insight card-insight-warn">${d.surgeReason} surge active - wait 30-60 min or use your own vehicle to save ₹${Math.round(opt.fare * (d.multiplier - 1))}.</div>`;
                } else if (opt.mode === 'train') {
                    const flight = scoredOptions.find(o => o.mode === 'flight');
                    if (flight) {
                        const savings = flight.fare - opt.fare;
                        const timeExtra = opt.duration - flight.duration;
                        if (savings > 0) {
                            insightHtml = `<div class="card-insight">Saves ₹${savings} vs flight. Extra ${Math.round(timeExtra / 60)}h travel time.</div>`;
                        }
                    }
                } else if (opt.mode === 'flight') {
                    const cheapest = scoredOptions.find(o => o.mode === 'train' && o.subMode === 'train_sleeper');
                    if (cheapest) {
                        const timeSaved = cheapest.duration - opt.duration;
                        insightHtml = `<div class="card-insight">Fastest option - saves ${Math.round(timeSaved / 60)}h vs train sleeper.</div>`;
                    }
                } else if (opt.mode === 'bus' && opt.subMode === 'bus_ac_sleeper') {
                    insightHtml = `<div class="card-insight">Overnight sleeper - save a hotel night (~₹1,500).</div>`;
                } else if (opt.mode === 'bus') {
                    const acSleeper = scoredOptions.find(o => o.subMode === 'bus_ac_sleeper');
                    if (acSleeper) {
                        const savings = acSleeper.fare - opt.fare;
                        if (savings > 0) {
                            insightHtml = `<div class="card-insight">₹${savings} cheaper than AC Sleeper bus.</div>`;
                        }
                    }
                } else if (opt.mode === 'cab' || opt.mode === 'auto' || opt.mode === 'bike') {
                    const personal = scoredOptions.find(o => o.subMode && o.subMode.includes('personal') && o.mode === opt.mode);
                    if (personal) {
                        const diff = opt.fare - personal.fare;
                        if (diff > 0) {
                            insightHtml = `<div class="card-insight">Own vehicle saves ₹${diff} on this route (fuel only).</div>`;
                        }
                    }
                }

                let variantsHtml = '';
                let toggleHtml = '';
                if (variants.length > 0) {
                    const rows = variants.map((v, vi) => {
                        const vcanBook = v.mode === 'flight' && v.details && v.details.searchId && v.details.clickRef;
                        return `
                            <div class="variant-row" data-variant-index="${vi}">
                                <span class="variant-name">${v.name}</span>
                                <span class="variant-provider">${v.provider}</span>
                                <span class="variant-fare">₹${v.fare}${v.fareMin ? '-' + v.fareMax : ''}</span>
                                <span class="variant-time">${formatDuration(v.duration)}</span>
                                <span class="variant-score">${Math.round(v.compositeScore)}</span>
                                ${vcanBook ? `<button type="button" class="variant-book-btn" data-variant-index="${vi}">BOOK</button>` : '<span></span>'}
                            </div>
                        `;
                    }).join('');
                    variantsHtml = `<div class="mode-variants hidden">${rows}</div>`;
                    const modeLabel = modeLabels[opt.mode] || opt.mode;
                    toggleHtml = `<button type="button" class="variants-toggle" aria-expanded="false">Show ${variants.length} more ${modeLabel.toLowerCase()} option${variants.length > 1 ? 's' : ''}<span class="chev">▾</span></button>`;
                }

                card.innerHTML = `
                    <div class="card-top">
                        <div class="card-icon">${modeIcons[opt.mode] || '🚗'}</div>
                        <div>
                            <div class="card-name">${opt.name}</div>
                            <div class="card-provider">${opt.provider}${d.bookingProvider ? ' via ' + d.bookingProvider : ''}</div>
                        </div>
                        <div class="card-metric">
                            <span class="card-metric-label">FARE</span>
                            <span class="card-metric-val digital-text-green">₹${opt.fare}${opt.fareMin ? '-' + opt.fareMax : ''}</span>
                        </div>
                        <div class="card-metric">
                            <span class="card-metric-label">TIME</span>
                            <span class="card-metric-val digital-text-amber">${formatDuration(opt.duration)}</span>
                        </div>
                        ${canBook ? '<button type="button" class="book-btn">BOOK</button>' : '<div class="book-placeholder"></div>'}
                        <div class="card-score">
                            <span class="card-metric-label">SCORE</span>
                            <span class="card-score-val">${Math.round(opt.compositeScore)}</span>
                        </div>
                    </div>
                    ${legsHtml}
                    <div class="card-details">
                        <div class="card-detail-grid">${breakdownHtml}</div>
                        ${insightHtml}
                    </div>
                    ${toggleHtml}
                    ${variantsHtml}
                `;
                const bookButton = card.querySelector('.book-btn');
                if (bookButton) {
                    bookButton.addEventListener('click', () => openBookingLink(opt, bookButton));
                }

                // Toggle expand/collapse for variants
                const toggle = card.querySelector('.variants-toggle');
                const variantsList = card.querySelector('.mode-variants');
                if (toggle && variantsList) {
                    toggle.addEventListener('click', () => {
                        const isOpen = !variantsList.classList.contains('hidden');
                        if (isOpen) {
                            variantsList.classList.add('hidden');
                            toggle.setAttribute('aria-expanded', 'false');
                            toggle.querySelector('.chev').textContent = '▾';
                            toggle.firstChild.textContent = `Show ${variants.length} more ${(modeLabels[opt.mode] || opt.mode).toLowerCase()} option${variants.length > 1 ? 's' : ''}`;
                        } else {
                            variantsList.classList.remove('hidden');
                            toggle.setAttribute('aria-expanded', 'true');
                            toggle.querySelector('.chev').textContent = '▴';
                            toggle.firstChild.textContent = `Hide ${variants.length} other option${variants.length > 1 ? 's' : ''}`;
                        }
                    });
                }

                // Hook up variant book buttons
                card.querySelectorAll('.variant-book-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.variantIndex, 10);
                        openBookingLink(variants[idx], btn);
                    });
                });

                resultsList.appendChild(card);
            });

            loadingOverlay.classList.add('hidden');
            recommendationPanel.classList.remove('hidden');

        } catch (error) {
            console.error('Analysis error:', error);
            loadingOverlay.classList.add('hidden');
            resultsList.innerHTML = `<div class="empty-state">Error: ${error.message}<br><br>Make sure the server is running with: npm run start:http</div>`;
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.querySelector('.btn-text').textContent = 'ANALYZE ROUTES';
        }
    });
});
