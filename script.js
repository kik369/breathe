class SVGAnimation {
    constructor() {
        this.size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
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
    }

    initElements() {
        const initialGlowRadius = 50; // Set default glow radius to 50 pixels

        this.planet = this.draw
            .circle(this.size * 0.25)
            .fill(planetColorPicker.value)
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
            this.updatePlanetSize(0.4),
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

        planetColorPicker.addEventListener('input', e => {
            const radius = parseInt(glowRadiusSlider.value);
            this.updatePlanetGlow(e.target.value, radius);
        });

        planetSizeSlider.addEventListener('input', e =>
            this.onPlanetSizeChange(e)
        );
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
        satelliteColorPicker.addEventListener('input', e =>
            this.updateSatelliteColors(e.target.value)
        );
    }

    onPlanetSizeChange(e) {
        const scale = e.target.value / 100;
        const planetRadius = this.updatePlanetSize(scale);
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

    onSatelliteSizeChange(e) {
        const scale = e.target.value / 100;
        const satelliteSize = this.updateSatelliteSize(scale);
        const planetRadius = this.updatePlanetSize(
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
        const planetRadius = this.updatePlanetSize(
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
        this.size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        const padding = this.size * 0.5;
        this.draw
            .size(this.size + padding * 2, this.size + padding * 2)
            .viewbox(
                -padding,
                -padding,
                this.size + padding * 2,
                this.size + padding * 2
            );

        const planetRadius = this.updatePlanetSize(
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

    updatePlanetSize(scale) {
        const baseSatelliteSize =
            this.size * (satelliteSizeSlider.value / 100) * 0.25;
        const maxScale = this.getMaxPlanetScale(baseSatelliteSize);
        const constrainedScale = Math.min(scale, maxScale);

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
        const planetRadius = planetSize / 2;
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
        const positionVarianceFactor = positionVarianceSlider.value / 100;

        while (this.satellites.length < count) {
            const satellite = this.satelliteGroup
                .circle(baseSatelliteSize)
                .fill(satelliteColorPicker.value);
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
            satellite.data({
                currentAngle: baseAngle,
                baseAngle,
                targetAngle: baseAngle,
                startAngle: baseAngle,
            });
        });

        this.satellites.each((satellite, i) => {
            const currentAngle =
                satellite.data('currentAngle') || this.satelliteBaseAngles[i];
            const sizeVariance =
                baseSatelliteSize * 4 * sizeVarianceFactor * Math.random();
            const satelliteSize = baseSatelliteSize + sizeVariance;
            satellite.size(satelliteSize);
            const x = this.size / 2 + Math.cos(currentAngle) * planetRadius;
            const y = this.size / 2 + Math.sin(currentAngle) * planetRadius;
            satellite.center(x, y);
        });
    }

    startPulseAnimation() {
        const animate = () => {
            const currentScale = planetSizeSlider.value / 100;
            const satelliteSize =
                this.size * (satelliteSizeSlider.value / 100) * 0.25;
            const maxScale = this.getMaxPlanetScale(satelliteSize);
            const inhaleDuration = parseFloat(inhaleSlider.value) * 1000;
            const holdDuration = parseFloat(holdSlider.value) * 1000;
            const exhaleDuration = parseFloat(exhaleSlider.value) * 1000;
            const restDuration = parseFloat(restSlider.value) * 1000;
            const positionVarianceFactor = positionVarianceSlider.value / 100;

            if (positionVarianceFactor > 0) {
                this.satellites.each(satellite => {
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
                });
            }

            const inhaleHoldDuration = inhaleDuration + holdDuration;
            this.planet
                .animate(inhaleDuration, 0)
                .ease('<>')
                .size(this.size * maxScale)
                .during(pos => {
                    const currentPlanetSize = this.planet.width();
                    this.satellites.each(satellite => {
                        const angle =
                            positionVarianceFactor > 0
                                ? satellite.data('startAngle') +
                                  (this.normalizeAngle(
                                      satellite.data('targetAngle') -
                                          satellite.data('startAngle')
                                  ) *
                                      (pos * inhaleDuration)) /
                                      inhaleHoldDuration
                                : satellite.data('baseAngle');
                        const x =
                            this.size / 2 +
                            Math.cos(angle) * (currentPlanetSize / 2);
                        const y =
                            this.size / 2 +
                            Math.sin(angle) * (currentPlanetSize / 2);
                        satellite.center(x, y);
                    });
                })
                .after(() => {
                    this.planet
                        .animate(holdDuration, 0)
                        .ease('<>')
                        .size(this.size * maxScale)
                        .during(pos => {
                            if (positionVarianceFactor > 0) {
                                const currentPlanetSize = this.planet.width();
                                this.satellites.each(satellite => {
                                    const angle =
                                        satellite.data('startAngle') +
                                        (this.normalizeAngle(
                                            satellite.data('targetAngle') -
                                                satellite.data('startAngle')
                                        ) *
                                            (inhaleDuration +
                                                pos * holdDuration)) /
                                            inhaleHoldDuration;
                                    const x =
                                        this.size / 2 +
                                        Math.cos(angle) *
                                            (currentPlanetSize / 2);
                                    const y =
                                        this.size / 2 +
                                        Math.sin(angle) *
                                            (currentPlanetSize / 2);
                                    satellite.center(x, y);
                                });
                            }
                        })
                        .after(() => {
                            this.satellites.each(satellite => {
                                if (positionVarianceFactor > 0) {
                                    satellite.data(
                                        'currentAngle',
                                        satellite.data('targetAngle')
                                    );
                                }
                            });
                            if (positionVarianceFactor > 0) {
                                this.satellites.each(satellite => {
                                    const currentAngle =
                                        satellite.data('currentAngle');
                                    const baseAngle =
                                        satellite.data('baseAngle');
                                    const newTargetAngle = this.getNextPosition(
                                        currentAngle,
                                        baseAngle,
                                        positionVarianceFactor
                                    );
                                    satellite.data({
                                        targetAngle: newTargetAngle,
                                        startAngle: currentAngle,
                                    });
                                });
                            }
                            const exhaleRestDuration =
                                exhaleDuration + restDuration;
                            this.planet
                                .animate(exhaleDuration, 0)
                                .ease('<>')
                                .size(this.size * currentScale)
                                .during(pos => {
                                    const currentPlanetSize =
                                        this.planet.width();
                                    this.satellites.each(satellite => {
                                        const angle =
                                            positionVarianceFactor > 0
                                                ? satellite.data('startAngle') +
                                                  (this.normalizeAngle(
                                                      satellite.data(
                                                          'targetAngle'
                                                      ) -
                                                          satellite.data(
                                                              'startAngle'
                                                          )
                                                  ) *
                                                      (pos * exhaleDuration)) /
                                                      exhaleRestDuration
                                                : satellite.data('baseAngle');
                                        const x =
                                            this.size / 2 +
                                            Math.cos(angle) *
                                                (currentPlanetSize / 2);
                                        const y =
                                            this.size / 2 +
                                            Math.sin(angle) *
                                                (currentPlanetSize / 2);
                                        satellite.center(x, y);
                                    });
                                })
                                .after(() => {
                                    this.planet
                                        .animate(restDuration, 0)
                                        .ease('<>')
                                        .size(this.size * currentScale)
                                        .during(pos => {
                                            if (positionVarianceFactor > 0) {
                                                const currentPlanetSize =
                                                    this.planet.width();
                                                this.satellites.each(
                                                    satellite => {
                                                        const angle =
                                                            satellite.data(
                                                                'startAngle'
                                                            ) +
                                                            (this.normalizeAngle(
                                                                satellite.data(
                                                                    'targetAngle'
                                                                ) -
                                                                    satellite.data(
                                                                        'startAngle'
                                                                    )
                                                            ) *
                                                                (exhaleDuration +
                                                                    pos *
                                                                        restDuration)) /
                                                                exhaleRestDuration;
                                                        const x =
                                                            this.size / 2 +
                                                            Math.cos(angle) *
                                                                (currentPlanetSize /
                                                                    2);
                                                        const y =
                                                            this.size / 2 +
                                                            Math.sin(angle) *
                                                                (currentPlanetSize /
                                                                    2);
                                                        satellite.center(x, y);
                                                    }
                                                );
                                            }
                                        })
                                        .after(() => {
                                            this.satellites.each(satellite => {
                                                if (
                                                    positionVarianceFactor > 0
                                                ) {
                                                    satellite.data(
                                                        'currentAngle',
                                                        satellite.data(
                                                            'targetAngle'
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
        const maxSatelliteSize =
            baseSatelliteSize * (1 + (4 * satelliteVarianceSlider.value) / 100);
        const maxRadius = this.size / 2;
        return (2 * maxRadius - maxSatelliteSize) / this.size;
    }
}

new SVGAnimation();
