import SuperShape from './superShape';
import * as Tone from 'tone';

export default class App {
  constructor() {
    console.log('App constructor started');
    this.TWO_PI = Math.PI * 2;
    this.osc = 0;
    this.shapes = [];
    
    // Initialisation des paramètres de base
    this.params = {
      m: 2,
      n1: 1,
      n2: 1,
      n3: 1,
      radius: 100,
      speed: 0.01,
      isAnimating: true,
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 5,
      animationSpeed: 0.01,
      mRange: 2,
      nRange: 2,
      radiusRange: 20
    };

    // Initialisation des états des touches
    this.keyStates = {
      q: false,
      w: false,
      e: false,
      r: false
    };

    // Initialisation des modulations
    this.keyModulations = {
      q: { param: 'm', range: 3, phase: 0 },
      w: { param: 'n1', range: 3, phase: 0 },
      e: { param: 'n2', range: 3, phase: 0 },
      r: { param: 'n3', range: 3, phase: 0 }
    };

    // Initialisation des phases d'animation
    this.animationParams = {
      mPhase: Math.random() * this.TWO_PI,
      n1Phase: Math.random() * this.TWO_PI,
      n2Phase: Math.random() * this.TWO_PI,
      n3Phase: Math.random() * this.TWO_PI,
      radiusPhase: Math.random() * this.TWO_PI
    };

    // Initialisation de la transition
    this.resetTransition = {
      speed: 0.02,
      isResetting: false,
      baseValues: []
    };

    // Compteur de touches actives
    this.activeKeysCount = 0;
    
    // Initialisation de l'audio avec Tone.js
    this.setupAudio();
    
    // Couleur de base pour les formes
    this.baseColor = '#2C2C54'; // Bleu cosmos

    // Palette de couleurs pour les touches
    this.keyColors = {
      q: {
        active: '#FF6B6B',    // Rouge vif
        inactive: '#4A4A4A',  // Gris foncé
        transition: '#FF6B6B' // Pour la transition
      },
      w: {
        active: '#4ECDC4',    // Turquoise
        inactive: '#4A4A4A',  // Gris foncé
        transition: '#4ECDC4' // Pour la transition
      },
      e: {
        active: '#FFE66D',    // Jaune
        inactive: '#4A4A4A',  // Gris foncé
        transition: '#FFE66D' // Pour la transition
      },
      r: {
        active: '#95E1D3',    // Vert menthe
        inactive: '#4A4A4A',  // Gris foncé
        transition: '#95E1D3' // Pour la transition
      }
    };

    // Ajouter des paramètres pour les transitions des touches
    this.keyTransitions = {
      q: { current: 0, target: 0, speed: 0.05 },
      w: { current: 0, target: 0, speed: 0.05 },
      e: { current: 0, target: 0, speed: 0.05 },
      r: { current: 0, target: 0, speed: 0.05 }
    };

    // Création du canvas et setup
    this.createCanvas();
    console.log('Canvas created');

    // Création de la première shape
    this.addShape();
    
    // Setup des contrôles
    this.setupKeyboardControls();
    this.setupMouseControls();
    
    // Démarrage de l'animation
    this.animate();

    // Système de nettoyage périodique plus fréquent
    this.cleanupInterval = setInterval(() => this.cleanupNotes(), 100); // Vérification toutes les 100ms
    
    // Ajouter un écouteur pour le nettoyage lors de la destruction
    window.addEventListener('beforeunload', () => this.destroy());
  }

  setupAudio() {
    // Définir des progressions d'accords plus cinématographiques
    this.chordProgressions = {
      // Progression épique style Interstellar (Cm - Ab - Eb - Bb)
      progression1: {
        q: ["C3", "Ab3", "Eb3", "Bb3", "C3", "Ab3", "Eb3", "Bb3"],    // Fondamentales
        w: ["Eb3", "C4", "G3", "D4", "Eb3", "C4", "G3", "D4"],        // Tierces
        e: ["G3", "Eb4", "Bb3", "F4", "G3", "Eb4", "Bb3", "F4"],      // Quintes
        r: ["Bb3", "Ab4", "Eb4", "D4", "Bb3", "Ab4", "Eb4", "D4"]     // Septièmes/Extensions
      },
      // Progression dramatique (Dm - G - C - Am)
      progression2: {
        q: ["D3", "G3", "C3", "A3", "D3", "G3", "C3", "A3"],          // Fondamentales
        w: ["F3", "B3", "E3", "C4", "F3", "B3", "E3", "C4"],          // Tierces
        e: ["A3", "D4", "G3", "E4", "A3", "D4", "G3", "E4"],          // Quintes
        r: ["C4", "F4", "B3", "G4", "C4", "F4", "B3", "G4"]           // Septièmes/Extensions
      },
      // Progression mystérieuse (Em - C - G - D)
      progression3: {
        q: ["E3", "C3", "G3", "D3", "E3", "C3", "G3", "D3"],          // Fondamentales
        w: ["G3", "E3", "B3", "F3", "G3", "E3", "B3", "F3"],          // Tierces
        e: ["B3", "G3", "D4", "A3", "B3", "G3", "D4", "A3"],          // Quintes
        r: ["D4", "C4", "F4", "C4", "D4", "C4", "F4", "C4"]           // Septièmes/Extensions
      },
      // Progression émotionnelle (Am - F - C - G)
      progression4: {
        q: ["A3", "F3", "C3", "G3", "A3", "F3", "C3", "G3"],          // Fondamentales
        w: ["C4", "A3", "E3", "B3", "C4", "A3", "E3", "B3"],          // Tierces
        e: ["E4", "C4", "G3", "D4", "E4", "C4", "G3", "D4"],          // Quintes
        r: ["G4", "F4", "B3", "F4", "G4", "F4", "B3", "F4"]           // Septièmes/Extensions
      }
    };

    // Modifier les synthétiseurs pour un son plus riche et cinématographique
    this.synths = {
      q: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine4"    // Plus riche harmoniquement
        },
        envelope: {
          attack: 0.4,     // Plus long pour un son plus dramatique
          decay: 1.2,      // Plus long
          sustain: 0.6,    // Plus soutenu
          release: 3       // Plus long pour un son plus résonant
        },
        volume: -12
      }).toDestination(),
      
      w: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine4"
        },
        envelope: {
          attack: 0.45,
          decay: 1.3,
          sustain: 0.65,
          release: 3.2
        },
        volume: -13
      }).toDestination(),
      
      e: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine4"
        },
        envelope: {
          attack: 0.42,
          decay: 1.25,
          sustain: 0.62,
          release: 3.1
        },
        volume: -14
      }).toDestination(),
      
      r: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine4"
        },
        envelope: {
          attack: 0.43,
          decay: 1.28,
          sustain: 0.64,
          release: 3.3
        },
        volume: -15
      }).toDestination()
    };

    // Modifier les effets pour un son plus spatial et cinématographique
    this.effects = {
      reverb: new Tone.Reverb({
        decay: 12,         // Plus long pour plus d'espace
        wet: 0.5,         // Plus de réverbération
        preDelay: 0.4     // Plus de pré-délai pour plus d'espace
      }).toDestination(),
      
      delay: new Tone.FeedbackDelay({
        delayTime: 0.6,   // Plus long pour plus d'espace
        feedback: 0.4,    // Plus de feedback
        wet: 0.3          // Plus de delay
      }).toDestination(),
      
      filter: new Tone.Filter({
        type: "lowpass",
        frequency: 3000,  // Plus bas pour un son plus chaud
        rolloff: -24,     // Plus doux
        Q: 0.3           // Moins de résonance
      }).toDestination(),

      // Tremolo plus doux et plus lent
      tremolo: new Tone.Tremolo({
        frequency: 1,     // Plus lent
        depth: 0.2,       // Plus subtil
        type: "sine"      // Plus doux
      }).start().toDestination()
    };

    // Connecter les synthétiseurs aux effets avec le LFO
    Object.values(this.synths).forEach(synth => {
      synth.connect(this.effects.reverb);
      synth.connect(this.effects.delay);
      synth.connect(this.effects.filter);
      synth.connect(this.effects.tremolo);
    });

    // Utiliser la première progression par défaut
    this.currentProgression = 'progression1';
    this.chordVariationIndex = 0;

    // Ajouter un écouteur pour démarrer l'audio au premier clic
    document.addEventListener('click', async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
        console.log("Audio is ready");
      }
    });
  }

  createCanvas(width = window.innerWidth, height = window.innerHeight) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    document.body.appendChild(this.canvas);
  
  }

  draw() {
    // Vérification de base
    if (!this.ctx || !this.shapes) {
      console.warn('Context or shapes not initialized');
      return;
    }

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.osc += this.params.speed;

    // Mettre à jour les animations seulement si on a des formes
    if (this.params.isAnimating && this.shapes.length > 0) {
      try {
        this.updateShapeAnimation();
      } catch (error) {
        console.error('Error in updateShapeAnimation:', error);
      }
    }

    // Sauvegarder le contexte
    this.ctx.save();
    
    // Appliquer le zoom
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.params.zoom, this.params.zoom);
    this.ctx.translate(-this.width / 2, -this.height / 2);

    // Dessiner les formes
    this.shapes.forEach((shape, index) => {
      if (!shape) {
        console.warn(`Shape at index ${index} is undefined`);
        return;
      }

      try {
        // Calculer la couleur en fonction des touches actives
        const currentColor = this.calculateShapeColor(index);
        this.ctx.strokeStyle = currentColor;
        this.ctx.lineWidth = 2 / this.params.zoom;
        this.ctx.beginPath();

        const points = 500;
        const startAngle = this.animationParams.mPhase;
        
        // Premier point
        let r = shape.supershape(startAngle);
        let x = shape.radius * r * Math.cos(startAngle) + shape.offsetX;
        let y = shape.radius * r * Math.sin(startAngle) + shape.offsetY;
        this.ctx.moveTo(x, y);
        
        // Dessiner tous les points
        for (let i = 1; i <= points; i++) {
          const t = i / points;
          const angle = startAngle + (t * this.TWO_PI);
          r = shape.supershape(angle);
          x = shape.radius * r * Math.cos(angle) + shape.offsetX;
          y = shape.radius * r * Math.sin(angle) + shape.offsetY;
          this.ctx.lineTo(x, y);
        }

        this.ctx.closePath();
        this.ctx.stroke();
      } catch (error) {
        console.error(`Error drawing shape at index ${index}:`, error);
      }
    });

    // Restaurer le contexte
    this.ctx.restore();
  }

  map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  animate() {
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  setupKeyboardControls() {
    // Garder une trace des notes actives
    this.activeNotes = new Set();
    this.activeTimeouts = new Set();

    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'arrowup') {
        this.addShape();
      }
      
      if (this.synths[key] && !this.keyStates[key]) {
        // Nettoyer les notes existantes avant d'en jouer de nouvelles
        this.cleanupNotes();
        
        this.keyStates[key] = true;
        this.activeKeysCount++;
        
        if (this.keyTransitions[key]) {
          this.keyTransitions[key].target = 1;
        }

        const noteVariation = this.chordProgressions[this.currentProgression][key][this.chordVariationIndex];
        const velocity = 0.3 + (Math.random() * 0.2);
        
        // Utiliser la nouvelle méthode sécurisée
        this.triggerNoteSafely(this.synths[key], noteVariation, velocity);

        // Changer la progression d'accords après un certain nombre de notes jouées
        if (this.activeKeysCount === 1) {
          // Modifier les effets de manière encore plus douce
          const variationFactor = (this.chordVariationIndex + 1) / 8;
          this.effects.filter.frequency.rampTo(3500 + (variationFactor * 400), 1.5);
          this.effects.tremolo.frequency.value = 1.5 + (variationFactor * 0.3);
          this.effects.tremolo.depth.value = 0.12 + (variationFactor * 0.08);

          // Avancer la progression d'accords
          this.chordVariationIndex = (this.chordVariationIndex + 1) % 8;
          
          // Changer de progression après avoir fait le tour des variations
          if (this.chordVariationIndex === 0) {
            const progressions = ['progression1', 'progression2', 'progression3', 'progression4'];
            const currentIndex = progressions.indexOf(this.currentProgression);
            this.currentProgression = progressions[(currentIndex + 1) % progressions.length];
          }
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      
      if (this.synths[key] && this.keyStates[key]) {
        this.keyStates[key] = false;
        this.activeKeysCount--;
        
        if (this.keyTransitions[key]) {
          this.keyTransitions[key].target = 0;
        }

        const noteVariation = this.chordProgressions[this.currentProgression][key][this.chordVariationIndex];
        
        // Forcer l'arrêt de la note
        this.forceStopNote(noteVariation);
        
        // Nettoyer si nécessaire
        if (this.activeKeysCount === 0) {
          this.cleanupNotes();
          
          // Réinitialiser les effets
          this.effects.filter.frequency.rampTo(3500, 1.5);
          this.effects.tremolo.frequency.value = 1.5;
          this.effects.tremolo.depth.value = 0.15;
        }
      }
    });

    // Ajouter des écouteurs pour le nettoyage
    window.addEventListener('blur', () => {
      this.cleanupNotes();
      this.activeKeysCount = 0;
      Object.keys(this.keyStates).forEach(key => {
        this.keyStates[key] = false;
      });
    });

    // Ajouter un écouteur pour la perte de focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupNotes();
        this.activeKeysCount = 0;
        Object.keys(this.keyStates).forEach(key => {
          this.keyStates[key] = false;
        });
      }
    });
  }

  setupMouseControls() {
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.05;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      
      // Calculer le nouveau zoom avec des limites
      const newZoom = Math.max(
        this.params.minZoom,
        Math.min(this.params.maxZoom, this.params.zoom + delta)
      );
      
      // Mettre à jour le zoom
      this.params.zoom = newZoom;
    });
  }

  getRandomParams() {
    // Obtenir le rayon de la dernière forme ajoutée, ou utiliser une valeur par défaut
    const lastRadius = this.shapes.length > 0 ? this.shapes[this.shapes.length - 1].radius : 50;
    
    // Calculer un rayon progressif basé sur le nombre de formes
    const baseRadius = 100; // Rayon de base
    const radiusIncrement = 20; // Incrément entre chaque forme
    const newRadius = Math.min(200, baseRadius + (this.shapes.length * radiusIncrement));

    // Calculer les paramètres de forme de manière prévisible
    const baseM = 2; // Valeur de base pour m
    const baseN = 1; // Valeur de base pour n1, n2, n3
    
    // Variations progressives pour chaque paramètre
    const mVariation = 0.5; // Variation de m entre les formes
    const nVariation = 0.3; // Variation des paramètres n entre les formes
    
    // Calculer les paramètres en fonction de l'index
    const index = this.shapes.length;
    const m = baseM + (index * mVariation);
    const n1 = baseN + (index * nVariation);
    const n2 = baseN + (index * nVariation * 0.8);
    const n3 = baseN + (index * nVariation * 0.6);

    return {
      m: Math.min(10, m),        // Limiter m à 10
      n1: Math.min(10, n1),      // Limiter n1 à 10
      n2: Math.min(10, n2),      // Limiter n2 à 10
      n3: Math.min(10, n3),      // Limiter n3 à 10
      radius: newRadius,         // Rayon progressif
      color: this.baseColor      // Utiliser la couleur de base
    };
  }

  addShape() {
    const params = this.getRandomParams();
    
    const newShape = new SuperShape({
      a: 1,
      b: 1,
      m: params.m,
      n1: params.n1,
      n2: params.n2,
      n3: params.n3,
      color: params.color,
      offsetX: this.width / 2,
      offsetY: this.height / 2,
      radius: params.radius
    });
    this.shapes.push(newShape);

    // Ajuster l'amplitude d'animation de manière cohérente
    const baseRadiusRange = 20;
    const radiusRatio = newShape.radius / 100;
    this.params.radiusRange = Math.max(5, baseRadiusRange * radiusRatio);
  }

  // Ajouter une fonction d'interpolation linéaire
  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  updateShapeAnimation() {
    // Mettre à jour les transitions des touches
    Object.entries(this.keyTransitions).forEach(([key, transition]) => {
      transition.current = this.lerp(transition.current, transition.target, transition.speed);
    });

    if (this.activeKeysCount > 0) {
      try {
        this.resetTransition.isResetting = false;
        const baseSpeed = this.params.animationSpeed;
        
        // Mise à jour des phases avec des variations plus cohérentes
        this.animationParams.mPhase += baseSpeed;
        this.animationParams.n1Phase += baseSpeed * 0.618;
        this.animationParams.n2Phase += baseSpeed * 0.382;
        this.animationParams.n3Phase += baseSpeed * 0.236;
        this.animationParams.radiusPhase += baseSpeed * 0.146;

        // Mise à jour des phases de modulation
        Object.entries(this.keyModulations).forEach(([key, mod]) => {
          if (this.keyStates && this.keyStates[key]) {
            mod.phase += baseSpeed;
          }
        });

        // Calculer les modulations des touches
        const keyModulations = {
          m: this.keyTransitions.q.current * Math.sin(this.keyModulations.q.phase) * this.keyModulations.q.range,
          n1: this.keyTransitions.w.current * Math.sin(this.keyModulations.w.phase) * this.keyModulations.w.range,
          n2: this.keyTransitions.e.current * Math.sin(this.keyModulations.e.phase) * this.keyModulations.e.range,
          n3: this.keyTransitions.r.current * Math.sin(this.keyModulations.r.phase) * this.keyModulations.r.range
        };

        // Animation des formes avec des variations plus harmonieuses
        this.shapes.forEach((shape, index) => {
          if (!shape) {
            console.warn(`Shape at index ${index} is undefined`);
            return;
          }

          // Calculer un décalage de phase plus subtil basé sur l'index
          const phaseOffset = (index / this.shapes.length) * Math.PI;
          
          // Réduire l'effet de l'index sur les variations
          const indexInfluence = 0.5 + (index / this.shapes.length) * 0.5;

          // Animation de M avec variation plus contrôlée
          const mExp = Math.exp(Math.sin(this.animationParams.mPhase + phaseOffset) * 0.3);
          shape.m = Math.max(0.5, this.params.m + 
            (mExp - 1) * this.params.mRange * indexInfluence + 
            keyModulations.m * (1 - index * 0.02));

          // Animation des autres paramètres avec variations plus harmonieuses
          const n1Exp = Math.exp(Math.sin(this.animationParams.n1Phase + phaseOffset * 0.618) * 0.3);
          const n2Exp = Math.exp(Math.sin(this.animationParams.n2Phase + phaseOffset * 0.382) * 0.3);
          const n3Exp = Math.exp(Math.sin(this.animationParams.n3Phase + phaseOffset * 0.236) * 0.3);

          shape.n1 = Math.max(0.1, this.params.n1 + 
            (n1Exp - 1) * this.params.nRange * indexInfluence + 
            keyModulations.n1 * (1 - index * 0.02));
          
          shape.n2 = Math.max(0.1, this.params.n2 + 
            (n2Exp - 1) * this.params.nRange * indexInfluence + 
            keyModulations.n2 * (1 - index * 0.02));
          
          shape.n3 = Math.max(0.1, this.params.n3 + 
            (n3Exp - 1) * this.params.nRange * indexInfluence + 
            keyModulations.n3 * (1 - index * 0.02));

          // Animation du rayon avec variation plus douce
          const baseRadius = this.params.radius * (1 + index * 0.1);
          const radiusExp = Math.exp(Math.sin(this.animationParams.radiusPhase + phaseOffset * 0.146) * 0.3);
          shape.radius = Math.max(10, baseRadius + 
            (radiusExp - 1) * this.params.radiusRange * indexInfluence);
        });
      } catch (error) {
        console.error('Error in animation update:', error);
      }
    } else {
      // Si aucune touche n'est pressée, préparer la transition
      if (!this.resetTransition.isResetting) {
        // Stocker les valeurs de base pour chaque forme
        this.resetTransition.baseValues = this.shapes.map((shape, index) => ({
          m: this.params.m,
          n1: this.params.n1,
          n2: this.params.n2,
          n3: this.params.n3,
          radius: this.params.radius * (1 + index * 0.2)
        }));
        this.resetTransition.isResetting = true;
      }

      // Appliquer la transition douce vers les valeurs de base
      this.shapes.forEach((shape, index) => {
        const baseValues = this.resetTransition.baseValues[index];
        
        // Interpolation douce pour chaque paramètre
        shape.m = this.lerp(shape.m, baseValues.m, this.resetTransition.speed);
        shape.n1 = this.lerp(shape.n1, baseValues.n1, this.resetTransition.speed);
        shape.n2 = this.lerp(shape.n2, baseValues.n2, this.resetTransition.speed);
        shape.n3 = this.lerp(shape.n3, baseValues.n3, this.resetTransition.speed);
        shape.radius = this.lerp(shape.radius, baseValues.radius, this.resetTransition.speed);

        // Vérifier si la transition est terminée (si les valeurs sont suffisamment proches)
        const isCloseEnough = (current, target) => Math.abs(current - target) < 0.001;
        if (isCloseEnough(shape.m, baseValues.m) &&
            isCloseEnough(shape.n1, baseValues.n1) &&
            isCloseEnough(shape.n2, baseValues.n2) &&
            isCloseEnough(shape.n3, baseValues.n3) &&
            isCloseEnough(shape.radius, baseValues.radius)) {
          this.resetTransition.isResetting = false;
        }
      });
    }

    // Mise à jour de l'audio en fonction de l'animation
    // ... existing code ...
  }

  // Ajouter une méthode pour calculer la couleur en fonction des touches actives
  calculateShapeColor(index) {
    // Commencer avec la couleur de base
    let r = parseInt(this.baseColor.slice(1, 3), 16);
    let g = parseInt(this.baseColor.slice(3, 5), 16);
    let b = parseInt(this.baseColor.slice(5, 7), 16);

    // Pour chaque touche, ajouter sa contribution à la couleur
    Object.entries(this.keyTransitions).forEach(([key, transition]) => {
      if (transition.current > 0) {
        const keyColor = this.keyColors[key];
        const activeColor = keyColor.active;
        const contribution = transition.current * 0.5; // Intensité de la contribution

        // Ajouter la contribution de la couleur de la touche
        r = Math.min(255, r + parseInt(activeColor.slice(1, 3), 16) * contribution);
        g = Math.min(255, g + parseInt(activeColor.slice(3, 5), 16) * contribution);
        b = Math.min(255, b + parseInt(activeColor.slice(5, 7), 16) * contribution);
      }
    });

    // Convertir en hexadécimal
    const toHex = (n) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Ajouter une méthode pour obtenir la note actuelle avec variation
  getCurrentNote(key) {
    return this.chordProgressions[this.currentProgression][key][this.chordVariationIndex];
  }

  // Méthode simplifiée pour gérer le déclenchement des notes
  triggerNoteSafely(synth, note, velocity) {
    try {
      // Déclencher la note
      synth.triggerAttack(note, undefined, velocity);
      console.log(`Note déclenchée: ${note}`);
      this.activeNotes.add(note);
    } catch (error) {
      console.error('Erreur lors du déclenchement de la note:', error);
      this.activeNotes.delete(note);
    }
  }

  // Méthode simplifiée pour arrêter une note
  forceStopNote(note) {
    console.log(`Arrêt de la note: ${note}`);
    Object.values(this.synths).forEach(synth => {
      try {
        synth.triggerRelease(note);
      } catch (error) {
        console.warn(`Erreur lors de l'arrêt de la note ${note}:`, error);
      }
    });
    this.activeNotes.delete(note);
  }

  // Méthode de nettoyage simplifiée
  cleanupNotes() {
    // Vérifier les notes actives
    if (this.activeNotes.size > 0) {
      console.log(`Notes actives: ${Array.from(this.activeNotes).join(', ')}`);
      
      // Si aucune touche n'est pressée, arrêter toutes les notes
      if (this.activeKeysCount === 0) {
        console.log('Aucune touche pressée, nettoyage de toutes les notes');
        Array.from(this.activeNotes).forEach(note => this.forceStopNote(note));
      }
    }
  }

  destroy() {
    // Arrêter l'intervalle de nettoyage
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Arrêter toutes les notes
    Array.from(this.activeNotes).forEach(note => this.forceStopNote(note));
    this.activeNotes.clear();

    // Arrêter tous les synthétiseurs
    Object.values(this.synths).forEach(synth => {
      try {
        synth.dispose();
      } catch (error) {
        console.warn('Erreur lors de la destruction du synthétiseur:', error);
      }
    });

    // Arrêter tous les effets
    Object.values(this.effects).forEach(effect => {
      try {
        effect.dispose();
      } catch (error) {
        console.warn('Erreur lors de la destruction de l\'effet:', error);
      }
    });
  }
}
