class SVGAnimation {
    constructor() {
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
            250,
            this.updateMinPlanetSize(0.4),
            this.updateSatelliteSize(0.2)
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
            [positionVarianceSlider, 'positionVarianceValue'],
            [glowRadiusSlider, 'glowRadiusValue'],
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
            });
            satellite.size(initialSize);
            const x = this.size / 2 + Math.cos(baseAngle) * planetRadius;
            const y = this.size / 2 + Math.sin(baseAngle) * planetRadius;
            satellite.center(x, y);
        });
    }

    startPulseAnimation() {
        const animate = () => {
            const currentScale = planetSizeSlider.value / 100;
            const maxScale = maxPlanetSizeSlider.value / 100;
            const baseSatelliteSize =
                this.size * (satelliteSizeSlider.value / 100) * 0.25;
            const sizeVarianceFactor = satelliteVarianceSlider.value / 100;
            const maxAllowedScale = this.getMaxPlanetScale(baseSatelliteSize);
            // Use the minimum between user-set max and system-calculated max
            const effectiveMaxScale = Math.min(maxScale, maxAllowedScale);

            const inhaleDuration = parseFloat(inhaleSlider.value) * 1000;
            const holdDuration = parseFloat(holdSlider.value) * 1000;
            const exhaleDuration = parseFloat(exhaleSlider.value) * 1000;
            const restDuration = parseFloat(restSlider.value) * 1000;

            const positionVarianceFactor = positionVarianceSlider.value / 100;
            const isDynamicSize = document.getElementById(
                'dynamicSizeVariance'
            ).checked;

            const inhaleHoldDuration = inhaleDuration + holdDuration;
            const exhaleRestDuration = exhaleDuration + restDuration;

            const startColor = { r: 102, g: 125, b: 182 }; // #667db6
            const endColor = { r: 0, g: 130, b: 200 }; // #0082c8

            // Calculate new targets before animation starts
            this.satellites.each(satellite => {
                if (positionVarianceFactor > 0) {
                    const currentAngle = satellite.data('currentAngle');
                    const baseAngle = satellite.data('baseAngle');
                    const newTargetAngle = this.getNextPosition(
                        currentAngle,
                        baseAngle,
                        positionVarianceFactor
                    );
                    satellite.data({
                        targetAngle: newTargetAngle,
                        startAngle: currentAngle,
                    });
                } else {
                    // Smooth transition to base angle when variance is zero
                    satellite.data({
                        targetAngle: satellite.data('baseAngle'),
                        startAngle: satellite.data('currentAngle'),
                    });
                }

                if (isDynamicSize) {
                    const currentSize = satellite.data('currentSize');
                    const newTargetSize = this.getNextSize(
                        baseSatelliteSize,
                        sizeVarianceFactor
                    );
                    satellite.data({
                        targetSize: newTargetSize,
                        startSize: currentSize,
                    });
                }
            });

            // Inhale + Hold phase
            this.planet
                .animate({
                    ease: '<>',
                    duration: inhaleDuration,
                })
                .size(this.size * effectiveMaxScale)
                .during(pos => {
                    const currentPlanetSize = this.planet.width();
                    const color = this.interpolateColor(
                        startColor,
                        endColor,
                        pos
                    );
                    this.updatePlanetGlow(
                        `rgb(${color.r}, ${color.g}, ${color.b})`
                    );
                    this.satellites.each(satellite => {
                        const angle =
                            satellite.data('startAngle') +
                            (this.normalizeAngle(
                                satellite.data('targetAngle') -
                                    satellite.data('startAngle')
                            ) *
                                (pos * inhaleDuration)) /
                                inhaleHoldDuration;

                        if (isDynamicSize) {
                            const currentSize =
                                satellite.data('startSize') +
                                ((satellite.data('targetSize') -
                                    satellite.data('startSize')) *
                                    (pos * inhaleDuration)) /
                                    inhaleHoldDuration;
                            satellite.size(currentSize);
                        }

                        const x =
                            this.size / 2 +
                            Math.cos(angle) * (currentPlanetSize / 2);
                        const y =
                            this.size / 2 +
                            Math.sin(angle) * (currentPlanetSize / 2);
                        satellite.center(x, y);
                        satellite.fill(
                            `rgb(${color.r}, ${color.g}, ${color.b})`
                        );
                    });
                })
                .after(() => {
                    // Hold phase
                    this.planet
                        .animate({
                            ease: '<>',
                            duration: holdDuration,
                        })
                        .size(this.size * effectiveMaxScale)
                        .during(pos => {
                            const currentPlanetSize = this.planet.width();
                            const color = this.interpolateColor(
                                startColor,
                                endColor,
                                1 // Hold at end color
                            );
                            this.updatePlanetGlow(
                                `rgb(${color.r}, ${color.g}, ${color.b})`
                            );
                            this.satellites.each(satellite => {
                                const angle =
                                    satellite.data('startAngle') +
                                    this.normalizeAngle(
                                        satellite.data('targetAngle') -
                                            satellite.data('startAngle')
                                    ) *
                                        ((inhaleDuration + pos * holdDuration) /
                                            inhaleHoldDuration);

                                if (isDynamicSize) {
                                    const currentSize =
                                        satellite.data('startSize') +
                                        (satellite.data('targetSize') -
                                            satellite.data('startSize')) *
                                            ((inhaleDuration +
                                                pos * holdDuration) /
                                                inhaleHoldDuration);
                                    satellite.size(currentSize);
                                }

                                const x =
                                    this.size / 2 +
                                    Math.cos(angle) * (currentPlanetSize / 2);
                                const y =
                                    this.size / 2 +
                                    Math.sin(angle) * (currentPlanetSize / 2);
                                satellite.center(x, y);
                                satellite.fill(
                                    `rgb(${color.r}, ${color.g}, ${color.b})`
                                );
                            });
                        })
                        .after(() => {
                            // Update current values
                            this.satellites.each(satellite => {
                                satellite.data(
                                    'currentAngle',
                                    satellite.data('targetAngle')
                                );
                                if (isDynamicSize) {
                                    satellite.data(
                                        'currentSize',
                                        satellite.data('targetSize')
                                    );
                                }
                            });

                            // Calculate new targets for exhale phase
                            this.satellites.each(satellite => {
                                if (positionVarianceFactor > 0) {
                                    const newTargetAngle = this.getNextPosition(
                                        satellite.data('currentAngle'),
                                        satellite.data('baseAngle'),
                                        positionVarianceFactor
                                    );
                                    satellite.data({
                                        targetAngle: newTargetAngle,
                                        startAngle:
                                            satellite.data('currentAngle'),
                                    });
                                } else {
                                    // Smooth transition to base angle when variance is zero
                                    satellite.data({
                                        targetAngle:
                                            satellite.data('baseAngle'),
                                        startAngle:
                                            satellite.data('currentAngle'),
                                    });
                                }
                                if (isDynamicSize) {
                                    const newTargetSize = this.getNextSize(
                                        baseSatelliteSize,
                                        sizeVarianceFactor
                                    );
                                    satellite.data({
                                        targetSize: newTargetSize,
                                        startSize:
                                            satellite.data('currentSize'),
                                    });
                                }
                            });

                            // Exhale + Rest phase
                            this.planet
                                .animate({
                                    ease: '<>',
                                    duration: exhaleDuration,
                                })
                                .size(this.size * currentScale)
                                .during(pos => {
                                    const currentPlanetSize =
                                        this.planet.width();
                                    const color = this.interpolateColor(
                                        endColor,
                                        startColor,
                                        pos
                                    );
                                    this.updatePlanetGlow(
                                        `rgb(${color.r}, ${color.g}, ${color.b})`
                                    );
                                    this.satellites.each(satellite => {
                                        const angle =
                                            satellite.data('startAngle') +
                                            (this.normalizeAngle(
                                                satellite.data('targetAngle') -
                                                    satellite.data('startAngle')
                                            ) *
                                                (pos * exhaleDuration)) /
                                                exhaleRestDuration;

                                        if (isDynamicSize) {
                                            const currentSize =
                                                satellite.data('startSize') +
                                                ((satellite.data('targetSize') -
                                                    satellite.data(
                                                        'startSize'
                                                    )) *
                                                    (pos * exhaleDuration)) /
                                                    exhaleRestDuration;
                                            satellite.size(currentSize);
                                        }

                                        const x =
                                            this.size / 2 +
                                            Math.cos(angle) *
                                                (currentPlanetSize / 2);
                                        const y =
                                            this.size / 2 +
                                            Math.sin(angle) *
                                                (currentPlanetSize / 2);
                                        satellite.center(x, y);
                                        satellite.fill(
                                            `rgb(${color.r}, ${color.g}, ${color.b})`
                                        );
                                    });
                                })
                                .after(() => {
                                    // Rest phase
                                    this.planet
                                        .animate({
                                            ease: '<>',
                                            duration: restDuration,
                                        })
                                        .size(this.size * currentScale)
                                        .during(pos => {
                                            const currentPlanetSize =
                                                this.planet.width();
                                            const color = this.interpolateColor(
                                                endColor,
                                                startColor,
                                                1 // Rest at start color
                                            );
                                            this.updatePlanetGlow(
                                                `rgb(${color.r}, ${color.g}, ${color.b})`
                                            );
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
                                                        ((exhaleDuration +
                                                            pos *
                                                                restDuration) /
                                                            exhaleRestDuration);

                                                if (isDynamicSize) {
                                                    const currentSize =
                                                        satellite.data(
                                                            'startSize'
                                                        ) +
                                                        (satellite.data(
                                                            'targetSize'
                                                        ) -
                                                            satellite.data(
                                                                'startSize'
                                                            )) *
                                                            ((exhaleDuration +
                                                                pos *
                                                                    restDuration) /
                                                                exhaleRestDuration);
                                                    satellite.size(currentSize);
                                                }

                                                const x =
                                                    this.size / 2 +
                                                    Math.cos(angle) *
                                                        (currentPlanetSize / 2);
                                                const y =
                                                    this.size / 2 +
                                                    Math.sin(angle) *
                                                        (currentPlanetSize / 2);
                                                satellite.center(x, y);
                                                satellite.fill(
                                                    `rgb(${color.r}, ${color.g}, ${color.b})`
                                                );
                                            });
                                        })
                                        .after(() => {
                                            // Update final values
                                            this.satellites.each(satellite => {
                                                satellite.data(
                                                    'currentAngle',
                                                    satellite.data(
                                                        'targetAngle'
                                                    )
                                                );
                                                if (isDynamicSize) {
                                                    satellite.data(
                                                        'currentSize',
                                                        satellite.data(
                                                            'targetSize'
                                                        )
                                                    );
                                                }
                                            });
                                            animate();
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
        const randomOffset = (Math.random() - 0.5) * 2 * maxDeviation;
        return this.normalizeAngle(currentAngle + randomOffset);
    }

    getMaxPlanetScale(baseSatelliteSize) {
        const systemMaxScale =
            (2 * this.size -
                baseSatelliteSize *
                    (1 + (4 * satelliteVarianceSlider.value) / 100)) /
            this.size;
        const userMaxScale = maxPlanetSizeSlider.value / 100;
        return Math.min(systemMaxScale, userMaxScale);
    }

    getNextSize(baseSize, varianceFactor) {
        const maxVariance = baseSize * 4 * varianceFactor;
        return baseSize + Math.random() * maxVariance;
    }

    startSessionTimer() {
        const startTime = Date.now();
        const timerElement = document.getElementById('sessionTimer');

        setInterval(() => {
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
    }
}

new SVGAnimation();
