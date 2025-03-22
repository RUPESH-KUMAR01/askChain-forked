import numpy as np
import sympy as sp
import re

class PhysicsAgent:
    def __init__(self):
        # Define common symbols used in physics
        self.t = sp.Symbol('t')  # time
        self.x, self.y, self.z = sp.symbols('x y z')  # position
        self.v = sp.Symbol('v')  # velocity
        self.a = sp.Symbol('a')  # acceleration
        self.m = sp.Symbol('m')  # mass
        self.F = sp.Symbol('F')  # force
        self.E = sp.Symbol('E')  # energy
        self.g = 9.81  # acceleration due to gravity (m/s^2)
        
    def process_question(self, question):
        """
        Process a physics question and return an answer.
        
        Args:
            question (str): The user's question
            
        Returns:
            dict: Response containing answer and confidence
        """
        question_lower = question.lower()
        
        # Check for different types of physics problems
        if any(keyword in question_lower for keyword in ['newton', 'force', 'motion']):
            return self._mechanics(question)
        elif any(keyword in question_lower for keyword in ['energy', 'work', 'power']):
            return self._energy(question)
        elif any(keyword in question_lower for keyword in ['electric', 'magnetic', 'electromagnetism']):
            return self._electromagnetism(question)
        elif any(keyword in question_lower for keyword in ['quantum', 'wave', 'particle']):
            return self._quantum_physics(question)
        elif any(keyword in question_lower for keyword in ['thermo', 'heat', 'temperature']):
            return self._thermodynamics(question)
        else:
            # General physics explanation
            return {
                'answer': "I'm not sure I understand your physics question. Could you provide more details or specify what area of physics you're asking about?",
                'confidence': 0.3
            }
    
    def _mechanics(self, question):
        """Handle mechanics-related questions"""
        question_lower = question.lower()
        
        # Check for specific mechanics concepts
        if 'projectile' in question_lower:
            return {
                'answer': """
For projectile motion:
- The horizontal velocity remains constant (ignoring air resistance)
- The vertical velocity changes due to gravity
- The trajectory is parabolic
- The time of flight is t = (2 * initial_vertical_velocity) / g
- The maximum height is h = (initial_vertical_velocity)² / (2g)
- The range is R = (initial_velocity)² * sin(2θ) / g, where θ is the launch angle
                """,
                'confidence': 0.9
            }
        elif 'newton' in question_lower and 'law' in question_lower:
            return {
                'answer': """
Newton's Three Laws of Motion:
1. First Law (Law of Inertia): An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an external force.
2. Second Law: Force equals mass times acceleration (F = ma).
3. Third Law: For every action, there is an equal and opposite reaction.
                """,
                'confidence': 0.95
            }
        elif 'free fall' in question_lower:
            return {
                'answer': """
For an object in free fall near Earth's surface:
- The acceleration is constant at approximately 9.81 m/s² downward
- The velocity after time t is v = g * t (starting from rest)
- The distance fallen after time t is d = (1/2) * g * t²
- Air resistance is ignored in this simplified model
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "In mechanics, we study the motion of objects and the forces that cause that motion. This includes Newton's laws, kinematics, dynamics, and concepts like momentum and energy. Could you specify which aspect of mechanics you're interested in?",
                'confidence': 0.7
            }
    
    def _energy(self, question):
        """Handle energy-related questions"""
        question_lower = question.lower()
        
        if 'conservation' in question_lower:
            return {
                'answer': """
The Law of Conservation of Energy states that energy cannot be created or destroyed, only transformed from one form to another.

In a closed system, the total energy remains constant. For example:
- Potential energy can convert to kinetic energy (and vice versa)
- Mechanical energy can convert to thermal energy (but not easily back)
- Mass can convert to energy according to E = mc²

This principle is one of the most fundamental laws in physics.
                """,
                'confidence': 0.95
            }
        elif 'potential' in question_lower and 'energy' in question_lower:
            return {
                'answer': """
Potential energy is stored energy due to an object's position or configuration:

1. Gravitational potential energy: PE = mgh
   - m is mass
   - g is acceleration due to gravity (9.81 m/s² on Earth)
   - h is height

2. Elastic potential energy: PE = (1/2)kx²
   - k is the spring constant
   - x is the displacement from equilibrium

3. Electric potential energy: PE = kQq/r
   - k is Coulomb's constant
   - Q and q are charges
   - r is the distance between charges
                """,
                'confidence': 0.9
            }
        elif 'kinetic' in question_lower and 'energy' in question_lower:
            return {
                'answer': """
Kinetic energy is the energy of motion:

KE = (1/2)mv²
- m is the mass of the object
- v is the velocity

For rotational motion:
KE = (1/2)Iω²
- I is the moment of inertia
- ω is the angular velocity

Kinetic energy is always positive and increases with the square of velocity.
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Energy in physics refers to the capacity to do work. It exists in many forms including kinetic, potential, thermal, electrical, chemical, and nuclear energy. The total energy in a closed system remains constant according to the law of conservation of energy. Could you specify which aspect of energy you're interested in?",
                'confidence': 0.7
            }
    
    def _electromagnetism(self, question):
        """Handle electromagnetism-related questions"""
        question_lower = question.lower()
        
        if 'coulomb' in question_lower:
            return {
                'answer': """
Coulomb's Law describes the electric force between charged particles:

F = k * |q₁ * q₂| / r²

Where:
- F is the electric force
- k is Coulomb's constant (8.99 × 10⁹ N·m²/C²)
- q₁ and q₂ are the charges
- r is the distance between the charges

The force is attractive if the charges have opposite signs and repulsive if they have the same sign.
                """,
                'confidence': 0.9
            }
        elif 'faraday' in question_lower:
            return {
                'answer': """
Faraday's Law of Electromagnetic Induction states that the induced electromotive force (EMF) in a closed circuit is equal to the negative of the rate of change of magnetic flux through the circuit:

EMF = -dΦ/dt

Where:
- EMF is the electromotive force (voltage)
- Φ is the magnetic flux
- t is time

This principle is the basis for electric generators, transformers, and many other electromagnetic devices.
                """,
                'confidence': 0.9
            }
        elif 'maxwell' in question_lower and 'equation' in question_lower:
            return {
                'answer': """
Maxwell's Equations are four fundamental equations that describe electromagnetism:

1. Gauss's Law for Electricity: ∇·E = ρ/ε₀
   (Electric field diverges from electric charge)

2. Gauss's Law for Magnetism: ∇·B = 0
   (No magnetic monopoles exist)

3. Faraday's Law: ∇×E = -∂B/∂t
   (Changing magnetic fields create electric fields)

4. Ampère's Law with Maxwell's addition: ∇×B = μ₀J + μ₀ε₀∂E/∂t
   (Currents and changing electric fields create magnetic fields)

These equations unified electricity, magnetism, and optics into a single theory.
                """,
                'confidence': 0.95
            }
        else:
            return {
                'answer': "Electromagnetism is the study of the electromagnetic force, which is one of the four fundamental forces of nature. It includes electric fields, magnetic fields, and electromagnetic radiation. This branch of physics explains the behavior of charged particles, electric currents, and electromagnetic waves like light. Could you specify which aspect of electromagnetism you're interested in?",
                'confidence': 0.7
            }
    
    def _quantum_physics(self, question):
        """Handle quantum physics-related questions"""
        question_lower = question.lower()
        
        if 'uncertainty' in question_lower:
            return {
                'answer': """
Heisenberg's Uncertainty Principle states that it is impossible to simultaneously know both the position and momentum of a particle with arbitrary precision:

Δx · Δp ≥ ħ/2

Where:
- Δx is the uncertainty in position
- Δp is the uncertainty in momentum
- ħ is the reduced Planck constant (h/2π)

This is not due to measurement limitations but is a fundamental property of quantum systems. The more precisely we know a particle's position, the less precisely we can know its momentum, and vice versa.
                """,
                'confidence': 0.95
            }
        elif 'schrodinger' in question_lower:
            return {
                'answer': """
The Schrödinger Equation is a fundamental equation in quantum mechanics that describes how the quantum state of a physical system changes over time:

Time-dependent form:
iħ ∂Ψ/∂t = ĤΨ

Time-independent form:
ĤΨ = EΨ

Where:
- Ψ is the wave function
- ħ is the reduced Planck constant
- Ĥ is the Hamiltonian operator
- E is the energy of the system

The wave function Ψ contains all the information about a quantum system, and |Ψ|² gives the probability density of finding the particle at a specific position.
                """,
                'confidence': 0.9
            }
        elif 'entanglement' in question_lower:
            return {
                'answer': """
Quantum Entanglement is a phenomenon where two or more particles become correlated in such a way that the quantum state of each particle cannot be described independently of the others, regardless of the distance separating them.

Key properties:
1. Measurement of one entangled particle instantaneously affects its partner(s)
2. This effect appears to happen faster than light could travel between them
3. Einstein called this "spooky action at a distance"
4. It does not violate special relativity because no information is transmitted faster than light

Entanglement is a key resource in quantum computing, quantum cryptography, and quantum teleportation.
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Quantum physics (or quantum mechanics) is a fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles. It introduces concepts like wave-particle duality, quantization of energy, the uncertainty principle, and quantum entanglement that often contradict our intuition based on classical physics. Could you specify which aspect of quantum physics you're interested in?",
                'confidence': 0.7
            }
    
    def _thermodynamics(self, question):
        """Handle thermodynamics-related questions"""
        question_lower = question.lower()
        
        if 'first law' in question_lower:
            return {
                'answer': """
The First Law of Thermodynamics is essentially the law of conservation of energy applied to thermodynamic systems:

ΔU = Q - W

Where:
- ΔU is the change in internal energy of the system
- Q is the heat added to the system
- W is the work done by the system

This law states that energy cannot be created or destroyed, only transferred or converted from one form to another.
                """,
                'confidence': 0.95
            }
        elif 'second law' in question_lower:
            return {
                'answer': """
The Second Law of Thermodynamics can be stated in several equivalent ways:

1. Heat flows spontaneously from hot to cold objects, but not the reverse.
2. It is impossible to convert heat completely into work in a cyclic process.
3. The entropy of an isolated system never decreases over time.

Mathematically, for any process:
ΔS ≥ 0 (for isolated systems)

Where S is entropy, a measure of disorder or randomness.

This law introduces the concept of irreversibility and explains why certain processes occur spontaneously while others do not.
                """,
                'confidence': 0.95
            }
        elif 'entropy' in question_lower:
            return {
                'answer': """
Entropy (S) is a measure of disorder or randomness in a system. In thermodynamics:

1. Statistical definition: S = k ln(W)
   - k is Boltzmann's constant
   - W is the number of possible microscopic states

2. Classical thermodynamics: dS = δQ/T
   - δQ is the heat transferred
   - T is the absolute temperature

Key properties:
- Entropy always increases in isolated systems (Second Law)
- Maximum entropy corresponds to equilibrium
- Processes that increase entropy are irreversible
- Living organisms maintain low entropy locally by increasing entropy in their surroundings
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Thermodynamics is the branch of physics that deals with heat, work, temperature, and their relation to energy, radiation, and physical properties of matter. It describes how thermal energy is converted to and from other forms of energy and how it affects matter. The field is governed by four fundamental laws (Zeroth, First, Second, and Third Laws of Thermodynamics). Could you specify which aspect of thermodynamics you're interested in?",
                'confidence': 0.7
            }

