let size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
const draw = SVG().addTo('#drawing').size(size, size);
const planetSizeSlider = document.getElementById('planetSizeSlider');
const satelliteSizeSlider = document.getElementById('satelliteSizeSlider');
const satelliteCountSlider = document.getElementById('satelliteCountSlider');
const inhaleSlider = document.getElementById('inhaleSlider');
const holdSlider = document.getElementById('holdSlider');
const exhaleSlider = document.getElementById('exhaleSlider');
const restSlider = document.getElementById('restSlider');

[
    [inhaleSlider, 'inhaleValue'],
    [holdSlider, 'holdValue'],
    [exhaleSlider, 'exhaleValue'],
    [restSlider, 'restValue'],
].forEach(([slider, valueId]) => {
    slider.addEventListener('input', e => {
        document.getElementById(valueId).textContent = e.target.value;
    });
});

const planetColorPicker = document.getElementById('planetColorPicker');
const satelliteColorPicker = document.getElementById('satelliteColorPicker');

const planet = draw
    .circle(size * 0.25)
    .fill(planetColorPicker.value)
    .center(size / 2, size / 2);

const satelliteGroup = draw.group();
let satellites = new SVG.List([]);
const satelliteVarianceSlider = document.getElementById(
    'satelliteVarianceSlider'
);

satelliteVarianceSlider.addEventListener('input', e => {
    document.getElementById('satelliteVarianceValue').textContent =
        e.target.value;
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetSize / 2,
        updateSatelliteSize(satelliteSizeSlider.value / 100)
    );
});

const positionVarianceSlider = document.getElementById(
    'positionVarianceSlider'
);

positionVarianceSlider.addEventListener('input', e => {
    document.getElementById('positionVarianceValue').textContent =
        e.target.value;
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetRadius,
        updateSatelliteSize(satelliteSizeSlider.value / 100)
    );
});

let satelliteBaseAngles = [];

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

function getNextPosition(currentAngle, baseAngle, varianceFactor) {
    const maxDeviation = Math.PI * varianceFactor;
    const randomOffset = (Math.random() - 0.5) * 2 * maxDeviation;
    return normalizeAngle(currentAngle + randomOffset);
}

function updateSatellites(count, planetRadius, baseSatelliteSize) {
    const sizeVarianceFactor = satelliteVarianceSlider.value / 100;
    const positionVarianceFactor = positionVarianceSlider.value / 100;
    if (satellites.length !== count) {
        while (satellites.length < count) {
            const satellite = satelliteGroup
                .circle(baseSatelliteSize)
                .fill(satelliteColorPicker.value);
            satellites.push(satellite);
        }
        while (satellites.length > count) {
            const satellite = satellites.pop();
            satellite.remove();
        }
        satelliteBaseAngles = Array(count)
            .fill(0)
            .map((_, i) => {
                return (i * 2 * Math.PI) / count - Math.PI / 2;
            });
        satellites.each((satellite, i) => {
            const baseAngle = satelliteBaseAngles[i];
            satellite.data('currentAngle', baseAngle);
            satellite.data('baseAngle', baseAngle);
            satellite.data('targetAngle', baseAngle);
            satellite.data('startAngle', baseAngle);
        });
    }
    satellites.each((satellite, i) => {
        const baseAngle = satelliteBaseAngles[i];
        const currentAngle = satellite.data('currentAngle') || baseAngle;
        const sizeVariance =
            baseSatelliteSize * 4 * sizeVarianceFactor * Math.random();
        const satelliteSize = baseSatelliteSize + sizeVariance;
        satellite.size(satelliteSize);
        const x = size / 2 + Math.cos(currentAngle) * planetRadius;
        const y = size / 2 + Math.sin(currentAngle) * planetRadius;
        satellite.center(x, y);
    });
}

positionVarianceSlider.addEventListener('input', e => {
    document.getElementById('positionVarianceValue').textContent =
        e.target.value;
    satellites.each(satellite => {
        satellite.timeline().stop();
    });
    const planetRadius = planet.width() / 2;
    const satelliteSize = updateSatelliteSize(satelliteSizeSlider.value / 100);
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetRadius,
        satelliteSize
    );
    animatePositions();
});

function updateSatellitePositions(currentPlanetRadius) {
    satellites.each((satellite, i) => {
        const baseAngle = satellite.data('baseAngle');
        const offset = satellite.data('positionOffset') || 0;
        const angle = baseAngle + offset;
        const x = size / 2 + Math.cos(angle) * currentPlanetRadius;
        const y = size / 2 + Math.sin(angle) * currentPlanetRadius;
        satellite.center(x, y);
    });
}

const initialPlanetScale = planetSizeSlider.value / 100;
const initialSatelliteScale = satelliteSizeSlider.value / 100;
const planetSize = size * initialPlanetScale;
const planetRadius = planetSize / 2;
const satelliteSize = size * initialSatelliteScale * 0.25;

updateSatellites(
    parseInt(satelliteCountSlider.value),
    planetRadius,
    satelliteSize
);

function getMaxPlanetScale(baseSatelliteSize) {
    const maxSatelliteSize =
        baseSatelliteSize * (1 + (4 * satelliteVarianceSlider.value) / 100);
    const maxRadius = size / 2;
    return (2 * maxRadius - maxSatelliteSize) / size;
}

function updatePlanetSize(scale) {
    const baseSatelliteSize = size * (satelliteSizeSlider.value / 100) * 0.25;
    const maxScale = getMaxPlanetScale(baseSatelliteSize);
    const constrainedScale = Math.min(scale, maxScale);
    if (constrainedScale !== scale) {
        planetSizeSlider.value = constrainedScale * 100;
        document.getElementById('planetSliderValue').textContent = Math.round(
            constrainedScale * 100
        );
    }
    const planetSize = size * constrainedScale;
    const planetRadius = planetSize / 2;
    planet.size(planetSize);
    planet.center(size / 2, size / 2);
    return planetRadius;
}

function updateSatelliteSize(scale) {
    const planetScale = planetSizeSlider.value / 100;
    const planetSize = size * planetScale;
    const planetRadius = planetSize / 2;
    const maxSatelliteSize = size - planetSize;
    const requestedSize = size * scale * 0.25;
    const constrainedSize = Math.min(requestedSize, maxSatelliteSize);
    if (constrainedSize !== requestedSize) {
        const constrainedScale = (constrainedSize / size) * 4;
        satelliteSizeSlider.value = constrainedScale * 100;
        document.getElementById('satelliteSizeValue').textContent = Math.round(
            constrainedScale * 100
        );
    }
    return constrainedSize;
}

planetSizeSlider.addEventListener('input', e => {
    const scale = e.target.value / 100;
    const planetRadius = updatePlanetSize(scale);
    const satelliteSize = updateSatelliteSize(satelliteSizeSlider.value / 100);
    document.getElementById('planetSliderValue').textContent = e.target.value;
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetRadius,
        satelliteSize
    );
});

satelliteSizeSlider.addEventListener('input', e => {
    const scale = e.target.value / 100;
    const satelliteSize = updateSatelliteSize(scale);
    const planetScale = planetSizeSlider.value / 100;
    const planetRadius = updatePlanetSize(planetScale);
    document.getElementById('satelliteSizeValue').textContent = e.target.value;
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetRadius,
        satelliteSize
    );
});

satelliteCountSlider.addEventListener('input', e => {
    const planetScale = planetSizeSlider.value / 100;
    const planetRadius = updatePlanetSize(planetScale);
    const satelliteSize = updateSatelliteSize(satelliteSizeSlider.value / 100);
    document.getElementById('satelliteCountValue').textContent = e.target.value;
    updateSatellites(parseInt(e.target.value), planetRadius, satelliteSize);
});

window.addEventListener('resize', () => {
    if (animationTimer) {
        clearInterval(animationTimer);
    }
    size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    draw.size(size, size);
    const planetScale = planetSizeSlider.value / 100;
    const planetRadius = updatePlanetSize(planetScale);
    const satelliteSize = updateSatelliteSize(satelliteSizeSlider.value / 100);
    updateSatellites(
        parseInt(satelliteCountSlider.value),
        planetRadius,
        satelliteSize
    );
    planet.timeline().stop();
    startPulseAnimation();
});

let animationTimer = null;

function startPulseAnimation() {
    function animate() {
        const currentScale = planetSizeSlider.value / 100;
        const satelliteSize = size * (satelliteSizeSlider.value / 100) * 0.25;
        const maxScale = getMaxPlanetScale(satelliteSize);
        const inhaleDuration = parseFloat(inhaleSlider.value) * 1000;
        const holdDuration = parseFloat(holdSlider.value) * 1000;
        const exhaleDuration = parseFloat(exhaleSlider.value) * 1000;
        const restDuration = parseFloat(restSlider.value) * 1000;
        const positionVarianceFactor = positionVarianceSlider.value / 100;
        if (positionVarianceFactor > 0) {
            satellites.each(satellite => {
                const currentAngle = satellite.data('currentAngle');
                const baseAngle = satellite.data('baseAngle');
                const newTargetAngle = getNextPosition(
                    currentAngle,
                    baseAngle,
                    positionVarianceFactor
                );
                satellite.data('targetAngle', newTargetAngle);
                satellite.data('startAngle', currentAngle);
            });
        }
        const inhaleHoldDuration = inhaleDuration + holdDuration;
        planet
            .animate(inhaleDuration, 0)
            .ease('<>')
            .size(size * maxScale)
            .during(pos => {
                const currentPlanetSize = planet.width();
                satellites.each(satellite => {
                    if (positionVarianceFactor > 0) {
                        const startAngle = satellite.data('startAngle');
                        const targetAngle = satellite.data('targetAngle');
                        let angleDiff = normalizeAngle(
                            targetAngle - startAngle
                        );
                        const positionPos =
                            (pos * inhaleDuration) / inhaleHoldDuration;
                        const currentAngle =
                            startAngle + angleDiff * positionPos;
                        const x =
                            size / 2 +
                            Math.cos(currentAngle) * (currentPlanetSize / 2);
                        const y =
                            size / 2 +
                            Math.sin(currentAngle) * (currentPlanetSize / 2);
                        satellite.center(x, y);
                    } else {
                        const angle = satellite.data('baseAngle');
                        const x =
                            size / 2 +
                            Math.cos(angle) * (currentPlanetSize / 2);
                        const y =
                            size / 2 +
                            Math.sin(angle) * (currentPlanetSize / 2);
                        satellite.center(x, y);
                    }
                });
            })
            .after(() => {
                planet
                    .animate(holdDuration, 0)
                    .ease('<>')
                    .size(size * maxScale)
                    .during(pos => {
                        if (positionVarianceFactor > 0) {
                            const currentPlanetSize = planet.width();
                            satellites.each(satellite => {
                                const startAngle = satellite.data('startAngle');
                                const targetAngle =
                                    satellite.data('targetAngle');
                                let angleDiff = normalizeAngle(
                                    targetAngle - startAngle
                                );
                                const positionPos =
                                    (inhaleDuration + pos * holdDuration) /
                                    inhaleHoldDuration;
                                const currentAngle =
                                    startAngle + angleDiff * positionPos;
                                const x =
                                    size / 2 +
                                    Math.cos(currentAngle) *
                                        (currentPlanetSize / 2);
                                const y =
                                    size / 2 +
                                    Math.sin(currentAngle) *
                                        (currentPlanetSize / 2);
                                satellite.center(x, y);
                            });
                        }
                    })
                    .after(() => {
                        satellites.each(satellite => {
                            if (positionVarianceFactor > 0) {
                                satellite.data(
                                    'currentAngle',
                                    satellite.data('targetAngle')
                                );
                            }
                        });
                        if (positionVarianceFactor > 0) {
                            satellites.each(satellite => {
                                const currentAngle =
                                    satellite.data('currentAngle');
                                const baseAngle = satellite.data('baseAngle');
                                const newTargetAngle = getNextPosition(
                                    currentAngle,
                                    baseAngle,
                                    positionVarianceFactor
                                );
                                satellite.data('targetAngle', newTargetAngle);
                                satellite.data('startAngle', currentAngle);
                            });
                        }
                        const exhaleRestDuration =
                            exhaleDuration + restDuration;
                        planet
                            .animate(exhaleDuration, 0)
                            .ease('<>')
                            .size(size * currentScale)
                            .during(pos => {
                                const currentPlanetSize = planet.width();
                                satellites.each(satellite => {
                                    if (positionVarianceFactor > 0) {
                                        const startAngle =
                                            satellite.data('startAngle');
                                        const targetAngle =
                                            satellite.data('targetAngle');
                                        let angleDiff = normalizeAngle(
                                            targetAngle - startAngle
                                        );
                                        const positionPos =
                                            (pos * exhaleDuration) /
                                            exhaleRestDuration;
                                        const currentAngle =
                                            startAngle +
                                            angleDiff * positionPos;
                                        const x =
                                            size / 2 +
                                            Math.cos(currentAngle) *
                                                (currentPlanetSize / 2);
                                        const y =
                                            size / 2 +
                                            Math.sin(currentAngle) *
                                                (currentPlanetSize / 2);
                                        satellite.center(x, y);
                                    } else {
                                        const angle =
                                            satellite.data('baseAngle');
                                        const x =
                                            size / 2 +
                                            Math.cos(angle) *
                                                (currentPlanetSize / 2);
                                        const y =
                                            size / 2 +
                                            Math.sin(angle) *
                                                (currentPlanetSize / 2);
                                        satellite.center(x, y);
                                    }
                                });
                            })
                            .after(() => {
                                planet
                                    .animate(restDuration, 0)
                                    .ease('<>')
                                    .size(size * currentScale)
                                    .during(pos => {
                                        if (positionVarianceFactor > 0) {
                                            const currentPlanetSize =
                                                planet.width();
                                            satellites.each(satellite => {
                                                const startAngle =
                                                    satellite.data(
                                                        'startAngle'
                                                    );
                                                const targetAngle =
                                                    satellite.data(
                                                        'targetAngle'
                                                    );
                                                let angleDiff = normalizeAngle(
                                                    targetAngle - startAngle
                                                );
                                                const positionPos =
                                                    (exhaleDuration +
                                                        pos * restDuration) /
                                                    exhaleRestDuration;
                                                const currentAngle =
                                                    startAngle +
                                                    angleDiff * positionPos;
                                                const x =
                                                    size / 2 +
                                                    Math.cos(currentAngle) *
                                                        (currentPlanetSize / 2);
                                                const y =
                                                    size / 2 +
                                                    Math.sin(currentAngle) *
                                                        (currentPlanetSize / 2);
                                                satellite.center(x, y);
                                            });
                                        }
                                    })
                                    .after(() => {
                                        satellites.each(satellite => {
                                            if (positionVarianceFactor > 0) {
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
    }
    animate();
}

startPulseAnimation();

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('visible');
});

document.addEventListener('click', e => {
    if (
        !settingsPanel.contains(e.target) &&
        !settingsToggle.contains(e.target)
    ) {
        settingsPanel.classList.remove('visible');
    }
});

planetColorPicker.addEventListener('input', e => {
    planet.fill(e.target.value);
});

satelliteColorPicker.addEventListener('input', e => {
    satellites.each(satellite => {
        satellite.fill(e.target.value);
    });
});
