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

    // Ajouter un système de suivi des notes actives
    this.activeNotes = new Set();
    
    // Ajouter un nettoyage périodique
    this.cleanupInterval = setInterval(() => this.cleanupNotes(), 1000);
  }

  setupAudio() {
    // Créer les synthétiseurs pour chaque touche avec des sons plus doux
    this.synths = {
      q: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine"    // Plus doux que sine4
        },
        envelope: {
          attack: 0.3,     // Plus doux
          decay: 0.4,      // Plus court
          sustain: 0.4,    // Moins soutenu
          release: 1.5     // Plus court
        },
        volume: -20        // Volume plus bas
      }).toDestination(),
      
      w: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.35,
          decay: 0.45,
          sustain: 0.45,
          release: 1.6
        },
        volume: -21
      }).toDestination(),
      
      e: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.32,
          decay: 0.42,
          sustain: 0.42,
          release: 1.55
        },
        volume: -22
      }).toDestination(),
      
      r: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.33,
          decay: 0.43,
          sustain: 0.43,
          release: 1.65
        },
        volume: -23
      }).toDestination()
    };

    // Ajouter un LFO plus doux pour les variations de volume
    this.lfo = new Tone.LFO({
      frequency: 0.1,      // Plus lent
      min: 0.6,           // Volume minimum plus haut
      max: 0.8            // Volume maximum plus doux
    }).start();

    // Créer des effets plus doux
    this.effects = {
      reverb: new Tone.Reverb({
        decay: 4,         // Plus court
        wet: 0.2,         // Moins de réverbération
        preDelay: 0.1     // Plus court
      }).toDestination(),
      
      delay: new Tone.FeedbackDelay({
        delayTime: 0.2,   // Plus court
        feedback: 0.2,    // Moins de feedback
        wet: 0.1          // Moins de delay
      }).toDestination(),
      
      filter: new Tone.Filter({
        type: "lowpass",
        frequency: 3000,  // Plus bas pour réduire les hautes fréquences
        rolloff: -12,
        Q: 0.3           // Moins de résonance
      }).toDestination(),

      // Tremolo plus doux
      tremolo: new Tone.Tremolo({
        frequency: 1,     // Plus lent
        depth: 0.1,       // Plus subtil
        type: "sine"
      }).start().toDestination()
    };

    // Connecter les synthétiseurs aux effets avec le LFO
    Object.values(this.synths).forEach(synth => {
      synth.connect(this.effects.reverb);
      synth.connect(this.effects.delay);
      synth.connect(this.effects.filter);
      synth.connect(this.effects.tremolo);
      this.lfo.connect(synth.volume);
    });

    // Définir une progression d'accords plus riche et harmonieuse
    this.chordProgressions = {
      // Progression I - IV - V - I en majeur 7
      progression1: {
        q: ["C4", "F4", "G4", "C4"],    // Fondamentales
        w: ["E4", "A4", "B4", "E4"],    // Tierces
        e: ["G4", "C5", "D5", "G4"],    // Quintes
        r: ["B4", "E5", "F5", "B4"]     // Septièmes
      },
      // Progression ii - V - I - vi en mineur 7
      progression2: {
        q: ["D4", "G4", "C4", "A4"],    // Fondamentales
        w: ["F4", "B4", "E4", "C5"],    // Tierces
        e: ["A4", "D5", "G4", "E5"],    // Quintes
        r: ["C5", "F5", "B4", "G5"]     // Septièmes
      }
    };

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

    // Ajouter le piano cosmique avec des paramètres plus doux
    this.cosmicPiano = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",    // Plus doux
        partials: [1, 2, 3]  // Moins de partiels
      },
      envelope: {
        attack: 0.4,      // Plus doux
        decay: 0.5,       // Plus court
        sustain: 0.4,     // Moins soutenu
        release: 2        // Plus court
      },
      volume: -15         // Volume plus bas
    }).toDestination();

    // Effets plus doux pour le piano cosmique
    this.cosmicEffects = {
      reverb: new Tone.Reverb({
        decay: 6,         // Plus court
        wet: 0.3,         // Moins de réverbération
        preDelay: 0.2     // Plus court
      }).toDestination(),

      chorus: new Tone.Chorus({
        frequency: 1,     // Plus lent
        delayTime: 2,     // Plus court
        depth: 0.3,       // Moins profond
        wet: 0.2          // Moins de mix
      }).start().toDestination(),

      delay: new Tone.FeedbackDelay({
        delayTime: 0.4,   // Plus court
        feedback: 0.2,    // Moins de feedback
        wet: 0.15         // Moins de mix
      }).toDestination(),

      filter: new Tone.Filter({
        type: "lowpass",
        frequency: 2500,  // Plus bas
        rolloff: -24,
        Q: 0.5
      }).toDestination(),

      filterLFO: new Tone.LFO({
        frequency: 0.05,  // Plus lent
        min: 1500,        // Plus bas
        max: 3000         // Plus bas
      }).start()
    };

    // Connecter les effets du piano cosmique
    this.cosmicPiano.connect(this.cosmicEffects.reverb);
    this.cosmicPiano.connect(this.cosmicEffects.chorus);
    this.cosmicPiano.connect(this.cosmicEffects.delay);
    this.cosmicPiano.connect(this.cosmicEffects.filter);
    this.cosmicEffects.filterLFO.connect(this.cosmicEffects.filter.frequency);

    // Définir les notes du piano cosmique (une octave plus haut que les accords)
    this.cosmicPianoNotes = {
      progression1: {
        q: ["C5", "F5", "G5", "C5"],    // Fondamentales
        w: ["E5", "A5", "B5", "E5"],    // Tierces
        e: ["G5", "C6", "D6", "G5"],    // Quintes
        r: ["B5", "E6", "F6", "B5"]     // Septièmes
      },
      progression2: {
        q: ["D5", "G5", "C5", "A5"],    // Fondamentales
        w: ["F5", "B5", "E5", "C6"],    // Tierces
        e: ["A5", "D6", "G5", "E6"],    // Quintes
        r: ["C6", "F6", "B5", "G6"]     // Septièmes
      }
    };
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
        const increment = this.TWO_PI / points;

        // Premier point
        const firstAngle = 0;
        let r = shape.supershape(firstAngle);
        let x = shape.radius * r * Math.cos(firstAngle) + shape.offsetX;
        let y = shape.radius * r * Math.sin(firstAngle) + shape.offsetY;
        this.ctx.moveTo(x, y);
      
        // Boucle principale pour dessiner tous les points sauf le dernier
        for (let i = 1; i < points; i++) {
          const angle = i * increment;
          r = shape.supershape(angle);
          x = shape.radius * r * Math.cos(angle) + shape.offsetX;
          y = shape.radius * r * Math.sin(angle) + shape.offsetY;
          this.ctx.lineTo(x, y);
        }
      
        // Dernier point pour fermer la forme (retour au point de départ)
        r = shape.supershape(this.TWO_PI);
        x = shape.radius * r * Math.cos(this.TWO_PI) + shape.offsetX;
        y = shape.radius * r * Math.sin(this.TWO_PI) + shape.offsetY;
        this.ctx.lineTo(x, y);
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
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'arrowup') {
        this.addShape();
        this.currentProgression = this.currentProgression === 'progression1' ? 'progression2' : 'progression1';
        this.chordVariationIndex = (this.chordVariationIndex + 1) % 4;
        
        // Modifier les effets du piano cosmique
        this.cosmicEffects.filterLFO.frequency.value = 0.05 + (Math.random() * 0.1);
        this.cosmicEffects.chorus.frequency.value = 1 + (Math.random() * 0.5);
      }
      
      if ((this.synths[key] || key === 'p') && !this.keyStates[key]) {
        this.keyStates[key] = true;
        this.activeKeysCount++;
        
        if (this.keyTransitions[key]) {
          this.keyTransitions[key].target = 1;
        }

        // Jouer les notes normales avec un volume plus bas
        if (this.synths[key]) {
          const noteVariation = this.chordProgressions[this.currentProgression][key][this.chordVariationIndex];
          const velocity = 0.3 + (Math.random() * 0.2); // Volume plus bas
          this.synths[key].triggerAttack(noteVariation, undefined, velocity);
        }

        // Jouer le piano cosmique avec un volume plus bas
        if (key === 'p') {
          // Nettoyer les notes précédentes avant de jouer
          this.activeNotes.forEach(note => {
            this.cosmicPiano.triggerRelease(note);
          });
          this.activeNotes.clear();

          // Jouer un arpège cosmique
          const currentChord = this.chordVariationIndex;
          const notes = [
            this.cosmicPianoNotes[this.currentProgression].q[currentChord],
            this.cosmicPianoNotes[this.currentProgression].w[currentChord],
            this.cosmicPianoNotes[this.currentProgression].e[currentChord],
            this.cosmicPianoNotes[this.currentProgression].r[currentChord]
          ];
          
          // Stocker les notes dans le Set
          notes.forEach(note => this.activeNotes.add(note));
          
          // Jouer les notes avec un délai plus long entre chaque
          notes.forEach((note, index) => {
            setTimeout(() => {
              if (this.keyStates['p']) {
                this.cosmicPiano.triggerAttack(note, undefined, 0.2 + (Math.random() * 0.1)); // Volume plus bas
              }
            }, index * 300); // Délai plus long entre les notes
          });
        }

        if (this.activeKeysCount === 1) {
          // Modifier les effets de manière plus douce
          const variationFactor = (this.chordVariationIndex + 1) / 4;
          this.effects.filter.frequency.rampTo(4000 + (variationFactor * 500), 1);
          this.effects.tremolo.frequency.value = 2 + (variationFactor * 0.5);
          this.effects.tremolo.depth.value = 0.15 + (variationFactor * 0.1);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if ((this.synths[key] || key === 'p') && this.keyStates[key]) {
        this.keyStates[key] = false;
        this.activeKeysCount--;
        
        if (this.keyTransitions[key]) {
          this.keyTransitions[key].target = 0;
        }

        // Arrêter les notes normales
        if (this.synths[key]) {
          const noteVariation = this.chordProgressions[this.currentProgression][key][this.chordVariationIndex];
          this.synths[key].triggerRelease(noteVariation);
        }

        // Arrêter le piano cosmique
        if (key === 'p') {
          // Arrêter toutes les notes actives du piano cosmique
          this.activeNotes.forEach(note => {
            this.cosmicPiano.triggerRelease(note);
          });
          this.activeNotes.clear();
        }
        
        if (this.activeKeysCount === 0) {
          // Nettoyer toutes les notes restantes
          this.cleanupNotes();
          
          // Réinitialiser les effets
          this.effects.filter.frequency.rampTo(4000, 1);
          this.effects.tremolo.frequency.value = 2;
          this.effects.tremolo.depth.value = 0.2;
        }
      }
    });

    // Ajouter un écouteur pour nettoyer lors de la perte de focus
    window.addEventListener('blur', () => {
      this.cleanupNotes();
      // Réinitialiser tous les états
      this.keyStates = {
        q: false,
        w: false,
        e: false,
        r: false,
        p: false
      };
      this.activeKeysCount = 0;
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
    
    try {
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

      // Vérifier que la forme est valide avant de l'ajouter
      if (newShape && typeof newShape === 'object') {
        this.shapes.push(newShape);
        
        // Ajuster l'amplitude d'animation de manière cohérente
        const baseRadiusRange = 20;
        const radiusRatio = newShape.radius / 100;
        this.params.radiusRange = Math.max(5, baseRadiusRange * radiusRatio);
      } else {
        console.warn('Invalid shape created');
      }
    } catch (error) {
      console.error('Error creating new shape:', error);
    }
  }

  // Ajouter une fonction d'interpolation linéaire
  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  updateShapeAnimation() {
    // Vérifier si on a des formes à animer
    if (!this.shapes || this.shapes.length === 0) return;

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
        this.shapes = this.shapes.filter(shape => shape !== null && shape !== undefined);
        
        this.shapes.forEach((shape, index) => {
          if (!shape || typeof shape !== 'object') {
            console.warn(`Invalid shape at index ${index}`);
            return;
          }

          try {
            // Calculer un décalage de phase plus subtil basé sur l'index
            const phaseOffset = (index / this.shapes.length) * Math.PI;
            
            // Réduire l'effet de l'index sur les variations
            const indexInfluence = 0.5 + (index / this.shapes.length) * 0.5;

            // Vérifier et initialiser les propriétés si nécessaire
            if (typeof shape.m === 'undefined') shape.m = this.params.m;
            if (typeof shape.n1 === 'undefined') shape.n1 = this.params.n1;
            if (typeof shape.n2 === 'undefined') shape.n2 = this.params.n2;
            if (typeof shape.n3 === 'undefined') shape.n3 = this.params.n3;
            if (typeof shape.radius === 'undefined') shape.radius = this.params.radius;

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
          } catch (error) {
            console.error(`Error animating shape at index ${index}:`, error);
          }
        });
      } catch (error) {
        console.error('Error in animation update:', error);
      }
    } else {
      // Si aucune touche n'est pressée, préparer la transition
      if (!this.resetTransition.isResetting) {
        // Stocker les valeurs de base pour chaque forme
        this.resetTransition.baseValues = this.shapes
          .filter(shape => shape !== null && shape !== undefined)
          .map((shape, index) => ({
            m: this.params.m,
            n1: this.params.n1,
            n2: this.params.n2,
            n3: this.params.n3,
            radius: this.params.radius * (1 + index * 0.2)
          }));
        this.resetTransition.isResetting = true;
      }

      // Appliquer la transition douce vers les valeurs de base
      this.shapes = this.shapes.filter(shape => shape !== null && shape !== undefined);
      
      this.shapes.forEach((shape, index) => {
        if (!shape || !this.resetTransition.baseValues[index]) return;

        const baseValues = this.resetTransition.baseValues[index];
        
        try {
          // Interpolation douce pour chaque paramètre
          shape.m = this.lerp(shape.m || this.params.m, baseValues.m, this.resetTransition.speed);
          shape.n1 = this.lerp(shape.n1 || this.params.n1, baseValues.n1, this.resetTransition.speed);
          shape.n2 = this.lerp(shape.n2 || this.params.n2, baseValues.n2, this.resetTransition.speed);
          shape.n3 = this.lerp(shape.n3 || this.params.n3, baseValues.n3, this.resetTransition.speed);
          shape.radius = this.lerp(shape.radius || this.params.radius, baseValues.radius, this.resetTransition.speed);

          // Vérifier si la transition est terminée
          const isCloseEnough = (current, target) => Math.abs(current - target) < 0.001;
          if (isCloseEnough(shape.m, baseValues.m) &&
              isCloseEnough(shape.n1, baseValues.n1) &&
              isCloseEnough(shape.n2, baseValues.n2) &&
              isCloseEnough(shape.n3, baseValues.n3) &&
              isCloseEnough(shape.radius, baseValues.radius)) {
            this.resetTransition.isResetting = false;
          }
        } catch (error) {
          console.error(`Error in shape transition at index ${index}:`, error);
        }
      });
    }
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

  // Ajouter une méthode de nettoyage des notes
  cleanupNotes() {
    // Arrêter toutes les notes actives si aucune touche n'est pressée
    if (this.activeKeysCount === 0 && this.activeNotes.size > 0) {
      this.activeNotes.forEach(note => {
        this.cosmicPiano.triggerRelease(note);
      });
      this.activeNotes.clear();
    }
  }

  // Ajouter une méthode de nettoyage lors de la destruction
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupNotes();
  }
}
