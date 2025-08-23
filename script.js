class SVGAnimation {
    constructor() {
        this.isPremium = false;
        this.sessionHistory = [];

        const minScreenDim = Math.min(window.innerWidth, window.innerHeight);

        if (window.innerWidth > 768) {
            this.size = Math.min(minScreenDim * 0.8, window.innerWidth / 3);
        } else {
            this.size = minScreenDim * 0.8;
        }

        const padding = this.size * 0.5;
        this.draw = SVG()
            .addTo('#drawing')
            .size(this.size + padding * 2, this.size + padding * 2)
            .viewbox(
                -padding,
                -padding,
                this.size + padding * 2,
                this.size + padding * 2
            );
        this.initElements();
        this.initEventListeners();
        this.startPulseAnimation();
        this.startSessionTimer();
        this.initTimer();
        this.loadAnalyticsData();
        this.checkForPremium();
    }

    initElements() {
        const initialGlowRadius = 50; // Set default glow radius to 50 pixels

        this.planet = this.draw
            .circle(this.size * 0.25)
            .fill('#667db6') // Default color
            .center(this.size / 2, this.size / 2)
            .filterWith(function (add) {
                const blur = add.gaussianBlur(initialGlowRadius);
                const secondBlur = add.gaussianBlur(initialGlowRadius * 1.67);
                add.blend(add.source, blur);
                add.blend(add.source, secondBlur);
                this.size('600%', '600%').move('-250%', '-250%');
            });

        this.satelliteGroup = this.draw.group();
        this.satellites = new SVG.List([]);
        this.satelliteBaseAngles = [];
        this.updateSatellites(
            50,
            this.updateMinPlanetSize(0.4),
            this.updateSatelliteSize(0.02)
        );
    }

    updatePlanetGlow(color, radius = null) {
        this.planet.fill(color);
        const filter = this.planet.filterer();

        if (radius !== null) {
            const blurs = filter.find('feGaussianBlur');
            if (blurs.length >= 2) {
                blurs[0].attr('stdDeviation', radius);
                blurs[1].attr('stdDeviation', radius * 1.67);
            }
        }
    }

    initEventListeners() {
        const sliders = [
            [planetSizeSlider, 'planetSliderValue'],
            [maxPlanetSizeSlider, 'maxPlanetSliderValue'],
            [satelliteSizeSlider, 'satelliteSizeValue'],
            [satelliteCountSlider, 'satelliteCountValue'],
            [inhaleSlider, 'inhaleValue'],
            [holdSlider, 'holdValue'],
            [exhaleSlider, 'exhaleValue'],
            [restSlider, 'restValue'],
            [satelliteVarianceSlider, 'satelliteVarianceValue'],
            [lateralVarianceSlider, 'lateralVarianceValue'],
            [glowRadiusSlider, 'glowRadiusValue'],
            [radialVarianceSlider, 'radialVarianceValue'],
        ];

        sliders.forEach(([slider, valueId]) => {
            slider.addEventListener('input', e => {
                document.getElementById(valueId).textContent = e.target.value;
            });
        });

        glowRadiusSlider.addEventListener('input', e => {
            const radius = parseInt(e.target.value);
            this.updatePlanetGlow(this.planet.fill(), radius);
        });

        planetSizeSlider.addEventListener('input', e => {
            const minValue = parseInt(e.target.value);
            const maxValue = parseInt(maxPlanetSizeSlider.value);

            if (minValue > maxValue) {
                maxPlanetSizeSlider.value = minValue;
                document.getElementById('maxPlanetSliderValue').textContent =
                    minValue;
            }
            this.onMinPlanetSizeChange(e);
        });

        maxPlanetSizeSlider.addEventListener('input', e => {
            const maxValue = parseInt(e.target.value);
            const minValue = parseInt(planetSizeSlider.value);

            if (maxValue < minValue) {
                e.target.value = minValue;
                document.getElementById('maxPlanetSliderValue').textContent =
                    minValue;
            } else {
                document.getElementById('maxPlanetSliderValue').textContent =
                    maxValue;
            }
            this.onMaxPlanetSizeChange(e);
        });

        satelliteSizeSlider.addEventListener('input', e =>
            this.onSatelliteSizeChange(e)
        );
        satelliteCountSlider.addEventListener('input', e =>
            this.onSatelliteCountChange(e)
        );
        window.addEventListener('resize', () => this.onWindowResize());
        settingsToggle.addEventListener('click', () =>
            this.toggleSettingsPanel()
        );
        document.addEventListener('click', e => this.hideSettingsPanel(e));

        // Add keyboard shortcut listener
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key.toLowerCase() === 'k') {
                e.preventDefault(); // Prevent default browser behavior
                this.toggleSettingsPanel();
            }
        });

        // Add group header click handlers
        document.querySelectorAll('.settings-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const currentContent = document.getElementById(
                    `${header.dataset.group}-content`
                );
                const wasActive = header.classList.contains('active');

                // Close all groups
                document
                    .querySelectorAll('.settings-group-header')
                    .forEach(h => {
                        h.classList.remove('active');
                        document
                            .getElementById(`${h.dataset.group}-content`)
                            .classList.remove('active');
                    });

                // Open clicked group if it wasn't active
                if (!wasActive) {
                    header.classList.add('active');
                    currentContent.classList.add('active');
                }
            });
        });

        const unlockPremiumBtn = document.getElementById('unlockPremiumBtn');
        unlockPremiumBtn.addEventListener('click', () =>
            this.handlePremiumUnlock()
        );
    }

    initTimer() {
        const showTimerCheckbox = document.getElementById('showTimerCheckbox');
        const timerDisplay = document.getElementById('timer-display');
        const progressBarContainer = document.getElementById(
            'progress-bar-container'
        );

        showTimerCheckbox.addEventListener('change', () => {
            if (showTimerCheckbox.checked) {
                timerDisplay.style.display = 'block';
                progressBarContainer.style.display = 'block';
            } else {
                timerDisplay.style.display = 'none';
                progressBarContainer.style.display = 'none';
            }
        });
    }

    onMinPlanetSizeChange(e) {
        const scale = e.target.value / 100;
        const planetRadius = this.updateMinPlanetSize(scale);
        const satelliteSize = this.updateSatelliteSize(
            satelliteSizeSlider.value / 100
        );
        document.getElementById('planetSliderValue').textContent =
            e.target.value;
        this.updateSatellites(
            parseInt(satelliteCountSlider.value),
            planetRadius,
            satelliteSize
        );
    }

    onMaxPlanetSizeChange(e) {
        const scale = planetSizeSlider.value / 100;
        const planetRadius = this.updateMinPlanetSize(scale);
        const satelliteSize = this.updateSatelliteSize(
            satelliteSizeSlider.value / 100
        );
        this.updateSatellites(
            parseInt(satelliteCountSlider.value),
            planetRadius,
            satelliteSize
        );
    }

    onSatelliteSizeChange(e) {
        const scale = e.target.value / 100;
        const satelliteSize = this.updateSatelliteSize(scale);
        const planetRadius = this.updateMinPlanetSize(
            planetSizeSlider.value / 100
        );
        document.getElementById('satelliteSizeValue').textContent =
            e.target.value;
        this.updateSatellites(
            parseInt(satelliteCountSlider.value),
            planetRadius,
            satelliteSize
        );
    }

    onSatelliteCountChange(e) {
        const planetRadius = this.updateMinPlanetSize(
            planetSizeSlider.value / 100
        );
        const satelliteSize = this.updateSatelliteSize(
            satelliteSizeSlider.value / 100
        );
        document.getElementById('satelliteCountValue').textContent =
            e.target.value;
        this.updateSatellites(
            parseInt(e.target.value),
            planetRadius,
            satelliteSize
        );
    }

    onWindowResize() {
        if (this.animationTimer) clearInterval(this.animationTimer);

        const minScreenDim = Math.min(window.innerWidth, window.innerHeight);
        if (window.innerWidth > 768) {
            this.size = Math.min(minScreenDim * 0.8, window.innerWidth / 3);
        } else {
            this.size = minScreenDim * 0.8;
        }

        const padding = this.size * 0.5;
        this.draw
            .size(this.size + padding * 2, this.size + padding * 2)
            .viewbox(
                -padding,
                -padding,
                this.size + padding * 2,
                this.size + padding * 2
            );

        const planetRadius = this.updateMinPlanetSize(
            planetSizeSlider.value / 100
        );
        const satelliteSize = this.updateSatelliteSize(
            satelliteSizeSlider.value / 100
        );
        this.updateSatellites(
            parseInt(satelliteCountSlider.value),
            planetRadius,
            satelliteSize
        );
        this.planet.timeline().stop();
        this.startPulseAnimation();
    }

    toggleSettingsPanel() {
        settingsPanel.classList.toggle('visible');
    }

    hideSettingsPanel(e) {
        if (
            !settingsPanel.contains(e.target) &&
            !settingsToggle.contains(e.target)
        ) {
            settingsPanel.classList.remove('visible');
        }
    }

    updateSatelliteColors(color) {
        this.satellites.each(satellite => satellite.fill(color));
    }

    updateMinPlanetSize(scale) {
        const baseSatelliteSize =
            this.size * (satelliteSizeSlider.value / 100) * 0.25;
        const systemMaxScale = this.getMaxPlanetScale(baseSatelliteSize);
        const userMaxScale = maxPlanetSizeSlider.value / 100;
        const effectiveMaxScale = Math.min(systemMaxScale, userMaxScale);
        const constrainedScale = Math.min(scale, effectiveMaxScale);

        if (constrainedScale !== scale) {
            planetSizeSlider.value = constrainedScale * 100;
            document.getElementById('planetSliderValue').textContent =
                Math.round(constrainedScale * 100);
        }

        const planetSize = this.size * constrainedScale;
        this.planet.size(planetSize).center(this.size / 2, this.size / 2);
        return planetSize / 2;
    }

    updateSatelliteSize(scale) {
        const planetScale = planetSizeSlider.value / 100;
        const planetSize = this.size * planetScale;
        const maxSatelliteSize = this.size - planetSize;
        const requestedSize = this.size * scale * 0.25;
        const constrainedSize = Math.min(requestedSize, maxSatelliteSize);

        if (constrainedSize !== requestedSize) {
            const constrainedScale = (constrainedSize / this.size) * 4;
            satelliteSizeSlider.value = constrainedScale * 100;
            document.getElementById('satelliteSizeValue').textContent =
                Math.round(constrainedScale * 100);
        }

        return constrainedSize;
    }

    updateSatellites(count, planetRadius, baseSatelliteSize) {
        const sizeVarianceFactor = satelliteVarianceSlider.value / 100;

        while (this.satellites.length < count) {
            const satellite = this.satelliteGroup
                .circle(baseSatelliteSize)
                .fill('#667db6');
            this.satellites.push(satellite);
        }
        while (this.satellites.length > count) {
            this.satellites.pop().remove();
        }

        this.satelliteBaseAngles = Array.from(
            { length: count },
            (_, i) => (i * 2 * Math.PI) / count - Math.PI / 2
        );
        this.satellites.each((satellite, i) => {
            const baseAngle = this.satelliteBaseAngles[i];
            const sizeVariance =
                baseSatelliteSize * 4 * sizeVarianceFactor * Math.random();
            const initialSize = baseSatelliteSize + sizeVariance;
            satellite.data({
                currentAngle: baseAngle,
                baseAngle: baseAngle,
                targetAngle: baseAngle,
                startAngle: baseAngle,
                currentSize: initialSize,
                targetSize: initialSize,
                startSize: initialSize,
                currentDistance: planetRadius,
                targetDistance: planetRadius,
                startDistance: planetRadius,
            });
            satellite.size(initialSize);
            const x = this.size / 2 + Math.cos(baseAngle) * planetRadius;
            const y = this.size / 2 + Math.sin(baseAngle) * planetRadius;
            satellite.center(x, y);
        });
    }

    startPulseAnimation() {
        // Cache timing values and convert to milliseconds once
        const timings = {
            inhale: parseFloat(inhaleSlider.value) * 1000,
            hold: parseFloat(holdSlider.value) * 1000,
            exhale: parseFloat(exhaleSlider.value) * 1000,
            rest: parseFloat(restSlider.value) * 1000,
        };
        timings.inhaleHold = timings.inhale + timings.hold;
        timings.exhaleRest = timings.exhale + timings.rest;

        // Cache colors for interpolation
        const colors = {
            start: { r: 102, g: 125, b: 182 }, // #667db6
            end: { r: 0, g: 130, b: 200 }, // #0082c8
        };

        const animate = () => {
            const currentScale = planetSizeSlider.value / 100;
            const maxScale = maxPlanetSizeSlider.value / 100;
            const baseSatelliteSize =
                this.size * (satelliteSizeSlider.value / 100) * 0.25;
            const sizeVarianceFactor = satelliteVarianceSlider.value / 100;
            const maxAllowedScale = this.getMaxPlanetScale(baseSatelliteSize);
            const effectiveMaxScale = Math.min(maxScale, maxAllowedScale);

            const lateralVarianceFactor = lateralVarianceSlider.value / 100;
            const varianceFactor = parseFloat(radialVarianceSlider.value);
            const isDynamicSize = document.getElementById(
                'dynamicSizeVariance'
            ).checked;

            // Calculate planetRadius once
            const planetRadius = this.updateMinPlanetSize(currentScale);
            const maxPlanetRadius = (this.size * effectiveMaxScale) / 2;
            const minPlanetRadius = (this.size * currentScale) / 2;

            // Pre-calculate satellite positions
            this.updateSatellitePositions(
                lateralVarianceFactor,
                isDynamicSize,
                baseSatelliteSize,
                sizeVarianceFactor,
                minPlanetRadius,
                maxPlanetRadius,
                varianceFactor
            );

            // Inhale + Hold phase
            this.planet
                .animate({
                    ease: '<>',
                    duration: timings.inhale,
                })
                .size(this.size * effectiveMaxScale)
                .during(pos => {
                    const color = this.interpolateColor(
                        colors.start,
                        colors.end,
                        pos
                    );
                    this.updatePlanetGlow(
                        `rgb(${color.r}, ${color.g}, ${color.b})`
                    );

                    const remainingTime = timings.inhale * (1 - pos);
                    this.updateTimerDisplay(remainingTime, 'Inhale', pos);

                    const halfCyclePos =
                        (pos * timings.inhale) / timings.inhaleHold;
                    this.updateSatellitesForPhase(
                        halfCyclePos,
                        'inhale',
                        color
                    );
                })
                .after(() => {
                    // Hold phase - planet stays static but satellites continue their animation
                    this.planet
                        .animate({
                            duration: timings.hold,
                        })
                        .size(this.size * effectiveMaxScale)
                        .during(pos => {
                            const remainingTime = timings.hold * (1 - pos);
                            this.updateTimerDisplay(remainingTime, 'Hold', pos);
                            // Continue satellite animation
                            const halfCyclePos =
                                (timings.inhale + pos * timings.hold) /
                                timings.inhaleHold;

                            this.satellites.each(satellite => {
                                const angle =
                                    satellite.data('startAngle') +
                                    this.normalizeAngle(
                                        satellite.data('targetAngle') -
                                            satellite.data('startAngle')
                                    ) *
                                        halfCyclePos;

                                const startDistance =
                                    satellite.data('currentDistance');
                                const targetDistance =
                                    satellite.data('inhaleDistance');
                                const distance =
                                    startDistance +
                                    (targetDistance - startDistance) *
                                        halfCyclePos;

                                const x =
                                    this.size / 2 + Math.cos(angle) * distance;
                                const y =
                                    this.size / 2 + Math.sin(angle) * distance;
                                satellite.center(x, y);
                            });
                        })
                        .after(() => {
                            // Before starting exhale, store the current positions and calculate new targets
                            this.satellites.each(satellite => {
                                const currentX = satellite.cx() - this.size / 2;
                                const currentY = satellite.cy() - this.size / 2;
                                const currentDistance = Math.sqrt(
                                    currentX * currentX + currentY * currentY
                                );
                                const currentAngle = Math.atan2(
                                    currentY,
                                    currentX
                                );

                                // Calculate new orbital target for exhale phase
                                const newTargetAngle =
                                    lateralVarianceFactor > 0
                                        ? this.getNextPosition(
                                              currentAngle,
                                              satellite.data('baseAngle'),
                                              lateralVarianceFactor
                                          )
                                        : satellite.data('baseAngle');

                                // Update the starting positions for exhale phase
                                satellite.data({
                                    startAngle: currentAngle,
                                    targetAngle: newTargetAngle,
                                    currentAngle: currentAngle,
                                    startDistance: currentDistance,
                                    currentDistance: currentDistance,
                                });
                            });

                            // Start exhale animation
                            this.planet
                                .animate({
                                    ease: '<>',
                                    duration: timings.exhale,
                                })
                                .size(this.size * currentScale)
                                .during(pos => {
                                    const remainingTime =
                                        timings.exhale * (1 - pos);
                                    this.updateTimerDisplay(
                                        remainingTime,
                                        'Exhale',
                                        pos
                                    );
                                    const color = this.interpolateColor(
                                        colors.end,
                                        colors.start,
                                        pos
                                    );
                                    this.updatePlanetGlow(
                                        `rgb(${color.r}, ${color.g}, ${color.b})`
                                    );

                                    const halfCyclePos =
                                        (pos * timings.exhale) /
                                        timings.exhaleRest;

                                    this.satellites.each(satellite => {
                                        const angle =
                                            satellite.data('startAngle') +
                                            this.normalizeAngle(
                                                satellite.data('targetAngle') -
                                                    satellite.data('startAngle')
                                            ) *
                                                halfCyclePos;

                                        const startDistance =
                                            satellite.data('startDistance');
                                        const targetDistance =
                                            satellite.data('exhaleDistance');
                                        const distance =
                                            startDistance +
                                            (targetDistance - startDistance) *
                                                halfCyclePos;

                                        const x =
                                            this.size / 2 +
                                            Math.cos(angle) * distance;
                                        const y =
                                            this.size / 2 +
                                            Math.sin(angle) * distance;
                                        satellite.center(x, y);
                                        satellite.fill(
                                            `rgb(${color.r}, ${color.g}, ${color.b})`
                                        );
                                    });
                                })
                                .after(() => {
                                    // Rest phase - planet stays static but satellites continue their animation
                                    this.planet
                                        .animate({
                                            duration: timings.rest,
                                        })
                                        .size(this.size * currentScale)
                                        .during(pos => {
                                            const remainingTime =
                                                timings.rest * (1 - pos);
                                            this.updateTimerDisplay(
                                                remainingTime,
                                                'Rest',
                                                pos
                                            );
                                            // Continue satellite animation
                                            const halfCyclePos =
                                                (timings.exhale +
                                                    pos * timings.rest) /
                                                timings.exhaleRest;

                                            this.satellites.each(satellite => {
                                                const angle =
                                                    satellite.data(
                                                        'startAngle'
                                                    ) +
                                                    this.normalizeAngle(
                                                        satellite.data(
                                                            'targetAngle'
                                                        ) -
                                                            satellite.data(
                                                                'startAngle'
                                                            )
                                                    ) *
                                                        halfCyclePos;

                                                const startDistance =
                                                    satellite.data(
                                                        'inhaleDistance'
                                                    );
                                                const targetDistance =
                                                    satellite.data(
                                                        'exhaleDistance'
                                                    );
                                                const distance =
                                                    startDistance +
                                                    (targetDistance -
                                                        startDistance) *
                                                        halfCyclePos;

                                                const x =
                                                    this.size / 2 +
                                                    Math.cos(angle) * distance;
                                                const y =
                                                    this.size / 2 +
                                                    Math.sin(angle) * distance;
                                                satellite.center(x, y);
                                            });
                                        })
                                        .after(() => {
                                            // Update for next cycle
                                            this.satellites.each(satellite => {
                                                satellite.data(
                                                    'currentDistance',
                                                    satellite.data(
                                                        'exhaleDistance'
                                                    )
                                                );

                                                // Calculate new positions for next cycle
                                                const {
                                                    inhaleDistance,
                                                    exhaleDistance,
                                                } =
                                                    this.calculateCyclePositions(
                                                        minPlanetRadius,
                                                        maxPlanetRadius,
                                                        varianceFactor
                                                    );
                                                satellite.data({
                                                    inhaleDistance,
                                                    exhaleDistance,
                                                });
                                            });

                                            animate(); // Start next cycle
                                        });
                                });
                        });
                });
        };
        animate();
    }

    interpolateColor(startColor, endColor, factor) {
        const r = Math.round(
            startColor.r + (endColor.r - startColor.r) * factor
        );
        const g = Math.round(
            startColor.g + (endColor.g - startColor.g) * factor
        );
        const b = Math.round(
            startColor.b + (endColor.b - startColor.b) * factor
        );
        return { r, g, b };
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    getNextPosition(currentAngle, baseAngle, varianceFactor) {
        const maxDeviation = Math.PI * varianceFactor;
        // Use a smaller random range for smoother transitions
        const randomOffset = (Math.random() - 0.5) * maxDeviation;
        // Gradually move towards base angle while adding variance
        const targetAngle = baseAngle + randomOffset;
        // Normalize the difference to prevent sudden jumps
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
        // Limit the maximum change per cycle
        const maxChange = Math.PI / 4; // 45 degrees max change
        const limitedDiff = Math.max(
            Math.min(angleDiff, maxChange),
            -maxChange
        );
        return this.normalizeAngle(currentAngle + limitedDiff);
    }

    getMaxPlanetScale(baseSatelliteSize) {
        const varianceFactor = satelliteVarianceSlider.value / 100;
        const systemMaxScale =
            (2 * this.size - baseSatelliteSize * (1 + 4 * varianceFactor)) /
            this.size;
        const userMaxScale = maxPlanetSizeSlider.value / 100;
        return Math.min(systemMaxScale, userMaxScale);
    }

    getNextSize(baseSize, varianceFactor) {
        if (!this._randomCache) {
            this._randomCache = new Float64Array(1024).map(() => Math.random());
            this._randomIndex = 0;
        }

        if (this._randomIndex >= this._randomCache.length) {
            this._randomIndex = 0;
        }

        const maxVariance = baseSize * 4 * varianceFactor;
        return baseSize + this._randomCache[this._randomIndex++] * maxVariance;
    }

    calculateHalfCycleRadialPosition(planetRadius, varianceFactor) {
        const maxOffset = planetRadius * (varianceFactor / 100);
        return planetRadius + Math.random() * maxOffset;
    }

    startSessionTimer() {
        const startTime = Date.now();
        this.currentSessionStartTime = startTime; // Store start time for logging
        const timerElement = document.getElementById('sessionTimer');

        this.sessionInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const hours = Math.floor(elapsedTime / 3600000)
                .toString()
                .padStart(2, '0');
            const minutes = Math.floor((elapsedTime % 3600000) / 60000)
                .toString()
                .padStart(2, '0');
            const seconds = Math.floor((elapsedTime % 60000) / 1000)
                .toString()
                .padStart(2, '0');
            timerElement.textContent = `Session: ${hours}:${minutes}:${seconds}`;
        }, 1000);

        // Add event listener to log session when user leaves the page
        window.addEventListener('beforeunload', () => this.logCurrentSession());
    }

    updateTimerDisplay(remainingTime, phase, progress) {
        const timerDisplay = document.getElementById('timer-display');
        const progressBar = document.getElementById('progress-bar');

        if (timerDisplay.style.display === 'block') {
            const seconds = Math.round(remainingTime / 1000);
            timerDisplay.textContent = `${phase}: ${seconds}s`;
            progressBar.style.width = `${progress * 100}%`;
        }
    }

    calculateCyclePositions(minPlanetRadius, maxPlanetRadius, varianceFactor) {
        if (varianceFactor === 0) {
            return {
                inhaleDistance: maxPlanetRadius,
                exhaleDistance: minPlanetRadius,
            };
        }

        if (!this._randomCache) {
            this._randomCache = new Float64Array(1024).map(() => Math.random());
            this._randomIndex = 0;
        }

        if (this._randomIndex >= this._randomCache.length) {
            this._randomIndex = 0;
        }

        const offsetPercentage = this._randomCache[this._randomIndex++];
        const maxInhaleOffset = maxPlanetRadius * (varianceFactor / 100);
        const maxExhaleOffset = minPlanetRadius * (varianceFactor / 100);

        return {
            inhaleDistance:
                maxPlanetRadius + maxInhaleOffset * offsetPercentage,
            exhaleDistance:
                minPlanetRadius + maxExhaleOffset * offsetPercentage,
        };
    }

    updateSatellitePositions(
        lateralVarianceFactor,
        isDynamicSize,
        baseSatelliteSize,
        sizeVarianceFactor,
        minPlanetRadius,
        maxPlanetRadius,
        varianceFactor
    ) {
        this.satellites.each(satellite => {
            // Calculate current position
            const currentX = satellite.cx() - this.size / 2;
            const currentY = satellite.cy() - this.size / 2;
            const currentDistance = Math.sqrt(
                currentX * currentX + currentY * currentY
            );
            const currentAngle = Math.atan2(currentY, currentX);

            // Calculate new target angle
            const newTargetAngle =
                lateralVarianceFactor > 0
                    ? this.getNextPosition(
                          currentAngle,
                          satellite.data('baseAngle'),
                          lateralVarianceFactor
                      )
                    : satellite.data('baseAngle');

            // Update angle data
            satellite.data({
                startAngle: currentAngle,
                targetAngle: newTargetAngle,
                currentAngle: currentAngle,
            });

            // Update size if dynamic
            if (isDynamicSize) {
                const currentSize = satellite.width();
                const newTargetSize = this.getNextSize(
                    baseSatelliteSize,
                    sizeVarianceFactor
                );
                satellite.data({
                    startSize: currentSize,
                    targetSize: newTargetSize,
                    currentSize: currentSize,
                });
            }

            // Calculate and store distances
            const { inhaleDistance, exhaleDistance } =
                this.calculateCyclePositions(
                    minPlanetRadius,
                    maxPlanetRadius,
                    varianceFactor
                );

            satellite.data({
                currentDistance: currentDistance,
                startDistance: currentDistance,
                inhaleDistance: inhaleDistance,
                exhaleDistance: exhaleDistance,
            });
        });
    }

    updateSatellitesForPhase(halfCyclePos, phase, color) {
        const isInhalePhase = phase === 'inhale';

        this.satellites.each(satellite => {
            // Calculate interpolated angle
            const angle =
                satellite.data('startAngle') +
                this.normalizeAngle(
                    satellite.data('targetAngle') - satellite.data('startAngle')
                ) *
                    halfCyclePos;

            // Get appropriate distances based on phase
            const startDistance = satellite.data('startDistance');
            const targetDistance = satellite.data(
                isInhalePhase ? 'inhaleDistance' : 'exhaleDistance'
            );

            // Calculate interpolated distance
            const distance =
                startDistance + (targetDistance - startDistance) * halfCyclePos;

            // Update position
            const x = this.size / 2 + Math.cos(angle) * distance;
            const y = this.size / 2 + Math.sin(angle) * distance;
            satellite.center(x, y);

            // Update color
            if (color) {
                satellite.fill(`rgb(${color.r}, ${color.g}, ${color.b})`);
            }
        });
    }

    async handlePremiumUnlock() {
        console.log('Attempting to unlock premium...');
        const unlockButton = document.getElementById('unlockPremiumBtn');
        unlockButton.textContent = 'Processing...';
        unlockButton.disabled = true;

        try {
            // The URL for your deployed worker. Replace with your actual worker URL.
            const workerUrl = 'https://functions.kris2511.workers.dev';

            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // You can send data here if needed in the future
                // body: JSON.stringify({ plan: 'lifetime' }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.checkout_url) {
                // Redirect the user to the secure checkout page
                window.location.href = data.checkout_url;
            } else {
                throw new Error('Checkout URL not found in response.');
            }
        } catch (error) {
            console.error('Failed to get checkout URL:', error);
            alert(
                'Could not connect to the payment server. Please try again later.'
            );
            unlockButton.textContent = 'Unlock Lifetime Premium';
            unlockButton.disabled = false;
        }
    }

    logCurrentSession() {
        if (!this.isPremium || !this.currentSessionStartTime) return;

        const sessionEndTime = Date.now();
        const duration = sessionEndTime - this.currentSessionStartTime;

        // Only log sessions longer than 30 seconds
        if (duration < 30000) return;

        const sessionData = {
            date: new Date().toISOString(),
            duration: duration, // in milliseconds
            inhale: inhaleSlider.value,
            hold: holdSlider.value,
            exhale: exhaleSlider.value,
            rest: restSlider.value,
        };

        this.sessionHistory.unshift(sessionData); // Add to beginning of array
        // Keep only the last 100 sessions
        if (this.sessionHistory.length > 100) {
            this.sessionHistory.pop();
        }
        localStorage.setItem('sessionHistory', JSON.stringify(this.sessionHistory));
        this.displayAnalytics();
    }

    loadAnalyticsData() {
        const storedHistory = localStorage.getItem('sessionHistory');
        if (storedHistory) {
            this.sessionHistory = JSON.parse(storedHistory);
        }
    }

    checkForPremium() {
        // 1. Check for the success URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('payment') && urlParams.get('payment') === 'success') {
            localStorage.setItem('isPremiumUser', 'true');
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Check localStorage for the premium flag
        if (localStorage.getItem('isPremiumUser') === 'true') {
            this.isPremium = true;
        }

        // 3. Update the UI based on premium status
        this.updateUIAfterPremiumCheck();
    }

    updateUIAfterPremiumCheck() {
        const premiumGroup = document.querySelector('[data-group="premium"]');
        const analyticsGroup = document.getElementById('analytics-panel');

        if (this.isPremium) {
            if (premiumGroup) {
                premiumGroup.style.display = 'none'; // Hide the upgrade button
            }
            if (analyticsGroup) {
                analyticsGroup.style.display = 'block'; // Show analytics panel
            }
            this.displayAnalytics();
        } else {
            if (analyticsGroup) {
                analyticsGroup.style.display = 'block'; // Show analytics but with a prompt
                const content = document.getElementById('analytics-content');
                content.innerHTML = `<p style="color: #ccc; text-align: center;">Unlock premium to track your session history and see your progress.</p>`;
            }
        }
    }

    displayAnalytics() {
        if (!this.isPremium) return;

        const content = document.getElementById('analytics-content');
        if (!this.sessionHistory.length) {
            content.innerHTML = `<p style="color: #ccc; text-align: center;">Your session history will appear here after you complete a session of at least 30 seconds.</p>`;
            return;
        }

        const totalMinutes = this.sessionHistory.reduce((acc, session) => acc + session.duration, 0) / 60000;
        
        let historyHtml = `<div style="margin-bottom: 15px; text-align: center;">
            <strong style="color: white;">Total Time:</strong> <span style="color: #ccc;">${Math.round(totalMinutes)} minutes</span><br>
            <strong style="color: white;">Total Sessions:</strong> <span style="color: #ccc;">${this.sessionHistory.length}</span>
        </div>
        <div style="max-height: 200px; overflow-y: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">`;

        this.sessionHistory.forEach(session => {
            const date = new Date(session.date);
            const durationMins = (session.duration / 60000).toFixed(1);
            historyHtml += `<div style="font-size: 0.8em; color: #ccc; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">
                <span>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span><br>
                <span>Duration: ${durationMins} min</span> | 
                <span>Pattern: ${session.inhale}-${session.hold}-${session.exhale}-${session.rest}</span>
            </div>`;
        });

        historyHtml += `</div>`;
        content.innerHTML = historyHtml;
    }
}

new SVGAnimation();
