import re
from rdkit import Chem
from rdkit.Chem import AllChem
import numpy as np

class ChemistryAgent:
    def __init__(self):
        # Common chemical elements
        self.elements = {
            'H': 'Hydrogen', 'He': 'Helium', 'Li': 'Lithium', 'Be': 'Beryllium',
            'B': 'Boron', 'C': 'Carbon', 'N': 'Nitrogen', 'O': 'Oxygen',
            'F': 'Fluorine', 'Ne': 'Neon', 'Na': 'Sodium', 'Mg': 'Magnesium',
            'Al': 'Aluminum', 'Si': 'Silicon', 'P': 'Phosphorus', 'S': 'Sulfur',
            'Cl': 'Chlorine', 'Ar': 'Argon', 'K': 'Potassium', 'Ca': 'Calcium'
        }
        
        # Common acids and bases
        self.acids_bases = {
            'HCl': 'Hydrochloric acid',
            'H2SO4': 'Sulfuric acid',
            'HNO3': 'Nitric acid',
            'CH3COOH': 'Acetic acid',
            'NaOH': 'Sodium hydroxide',
            'KOH': 'Potassium hydroxide',
            'NH3': 'Ammonia'
        }
        
    def process_question(self, question):
        """
        Process a chemistry question and return an answer.
        
        Args:
            question (str): The user's question
            
        Returns:
            dict: Response containing answer and confidence
        """
        question_lower = question.lower()
        
        # Check for different types of chemistry problems
        if any(keyword in question_lower for keyword in ['element', 'periodic table']):
            return self._periodic_table(question)
        elif any(keyword in question_lower for keyword in ['acid', 'base', 'ph']):
            return self._acid_base(question)
        elif any(keyword in question_lower for keyword in ['organic', 'molecule', 'compound']):
            return self._organic_chemistry(question)
        elif any(keyword in question_lower for keyword in ['reaction', 'equation']):
            return self._chemical_reactions(question)
        elif any(keyword in question_lower for keyword in ['bond', 'orbital', 'electron']):
            return self._chemical_bonding(question)
        else:
            # General chemistry explanation
            return {
                'answer': "I'm not sure I understand your chemistry question. Could you provide more details or specify what area of chemistry you're asking about?",
                'confidence': 0.3
            }
    
    def _periodic_table(self, question):
        """Handle questions about elements and the periodic table"""
        question_lower = question.lower()
        
        # Check if asking about a specific element
        for symbol, name in self.elements.items():
            if symbol.lower() in question_lower or name.lower() in question_lower:
                return {
                    'answer': f"""
{name} ({symbol}) is a chemical element in the periodic table.

Key properties:
- Symbol: {symbol}
- Name: {name}
- Type: {self._get_element_type(symbol)}
- Atomic number: {self._get_atomic_number(symbol)}
- Atomic weight: {self._get_atomic_weight(symbol)}
- Electron configuration: {self._get_electron_config(symbol)}
- Common oxidation states: {self._get_oxidation_states(symbol)}
                    """,
                    'confidence': 0.9
                }
        
        # General periodic table information
        if 'periodic table' in question_lower:
            return {
                'answer': """
The Periodic Table of Elements organizes all known chemical elements based on their properties and atomic structure.

Key features:
- Elements are arranged by increasing atomic number (number of protons)
- Elements in the same column (group) have similar chemical properties
- Elements in the same row (period) have the same number of electron shells
- The table is divided into metals (left), nonmetals (right), and metalloids (between)
- Main sections include alkali metals, alkaline earth metals, transition metals, halogens, and noble gases

The periodic table is one of the most important organizing principles in chemistry, as it helps predict chemical behavior and properties of elements.
                """,
                'confidence': 0.9
            }
        
        return {
            'answer': "I can provide information about chemical elements and the periodic table. Please specify which element or aspect of the periodic table you're interested in.",
            'confidence': 0.6
        }
    
    def _acid_base(self, question):
        """Handle questions about acids, bases, and pH"""
        question_lower = question.lower()
        
        if 'ph' in question_lower:
            return {
                'answer': """
pH is a scale used to measure how acidic or basic a solution is:

- pH ranges from 0 to 14
- pH = 7 is neutral (pure water)
- pH < 7 is acidic (lower = more acidic)
- pH > 7 is basic/alkaline (higher = more basic)

Mathematically: pH = -log[H⁺]
Where [H⁺] is the concentration of hydrogen ions in moles per liter

The pH scale is logarithmic, meaning each unit represents a 10-fold change in acidity.
                """,
                'confidence': 0.95
            }
        elif 'acid' in question_lower and 'base' in question_lower:
            return {
                'answer': """
Acids and Bases:

Acids:
- Donate H⁺ ions (protons) in solution (Brønsted-Lowry definition)
- Accept electron pairs (Lewis definition)
- Have pH < 7
- Taste sour (don't taste chemicals!)
- React with metals to produce hydrogen gas
- Turn blue litmus paper red

Bases:
- Accept H⁺ ions (protons) in solution (Brønsted-Lowry definition)
- Donate electron pairs (Lewis definition)
- Have pH > 7
- Taste bitter and feel slippery (don't taste chemicals!)
- Do not react with metals
- Turn red litmus paper blue

When acids and bases react, they form water and a salt in a neutralization reaction.
                """,
                'confidence': 0.9
            }
        elif 'buffer' in question_lower:
            return {
                'answer': """
A buffer solution resists changes in pH when small amounts of acid or base are added.

Buffer components:
- Weak acid and its conjugate base (e.g., acetic acid and acetate)
- Weak base and its conjugate acid (e.g., ammonia and ammonium)

The Henderson-Hasselbalch equation describes buffer behavior:
pH = pKa + log([A⁻]/[HA])

Where:
- pKa is the acid dissociation constant
- [A⁻] is the concentration of the conjugate base
- [HA] is the concentration of the weak acid

Buffers are crucial in biological systems, industrial processes, and laboratory work where pH stability is important.
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Acid-base chemistry deals with proton transfer reactions and is fundamental to many chemical and biological processes. This includes concepts like pH, neutralization, buffers, and titrations. Could you specify which aspect of acid-base chemistry you're interested in?",
                'confidence': 0.7
            }
    
    def _organic_chemistry(self, question):
        """Handle questions about organic chemistry"""
        question_lower = question.lower()
        
        if 'functional group' in question_lower:
            return {
                'answer': """
Functional groups are specific groups of atoms within organic molecules that determine the molecule's properties and reactivity.

Common functional groups:
- Alcohols (-OH): Found in ethanol, methanol
- Aldehydes (-CHO): Found in formaldehyde, acetaldehyde
- Ketones (C=O): Found in acetone
- Carboxylic acids (-COOH): Found in acetic acid, citric acid
- Esters (-COOR): Found in fats, fragrances
- Amines (-NH₂): Found in amino acids, neurotransmitters
- Amides (-CONH₂): Found in proteins
- Alkenes (C=C): Found in ethylene, natural rubber
- Alkynes (C≡C): Found in acetylene
- Ethers (-O-): Found in diethyl ether, anesthetics
- Haloalkanes (-X): Found in chloroform, CFCs

Each functional group undergoes characteristic reactions that help predict the behavior of organic compounds.
                """,
                'confidence': 0.95
            }
        elif any(term in question_lower for term in ['isomer', 'isomerism']):
            return {
                'answer': """
Isomers are compounds with the same molecular formula but different structural arrangements.

Types of isomerism:

1. Structural isomerism:
   - Constitutional isomers: Different connectivity (e.g., butane vs. isobutane)
   - Positional isomers: Same functional group in different positions (e.g., 1-propanol vs. 2-propanol)
   - Functional group isomers: Different functional groups (e.g., ethanol vs. dimethyl ether)

2. Stereoisomerism:
   - Geometric isomers: Different arrangement around a rigid structure like C=C (e.g., cis/trans)
   - Optical isomers: Mirror images that cannot be superimposed (e.g., L and D amino acids)
   - Conformational isomers: Different rotations around single bonds

Isomerism explains why compounds with the same formula can have different physical and chemical properties.
                """,
                'confidence': 0.9
            }
        elif 'polymer' in question_lower:
            return {
                'answer': """
Polymers are large molecules composed of repeating structural units (monomers) connected by covalent bonds.

Types of polymers:
1. Natural polymers: Proteins, DNA, cellulose, starch, rubber
2. Synthetic polymers: Plastics, synthetic fibers, adhesives

Polymerization mechanisms:
- Addition polymerization: Monomers add together without losing atoms (e.g., polyethylene)
- Condensation polymerization: Monomers join with loss of small molecules like water (e.g., nylon)

Properties of polymers depend on:
- Monomer structure
- Chain length and molecular weight
- Degree of branching or cross-linking
- Intermolecular forces

Polymers are essential in biology and form the basis of many modern materials.
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Organic chemistry is the study of carbon compounds, particularly those containing hydrogen, oxygen, nitrogen, and other elements. It encompasses the structure, properties, composition, reactions, and synthesis of these compounds, which form the basis of life and many modern materials. Could you specify which aspect of organic chemistry you're interested in?",
                'confidence': 0.7
            }
    
    def _chemical_reactions(self, question):
        """Handle questions about chemical reactions and equations"""
        question_lower = question.lower()
        
        if 'balance' in question_lower and 'equation' in question_lower:
            # Try to extract a chemical equation from the question
            equation_match = re.search(r'([A-Za-z0-9\s\+\-$$$$]+)(?:->|→|yields|gives)([A-Za-z0-9\s\+\-$$$$]+)', question)
            if equation_match:
                reactants = equation_match.group(1).strip()
                products = equation_match.group(2).strip()
                
                return {
                    'answer': f"""
To balance the chemical equation {reactants} → {products}:

1. Identify all elements and count their atoms on both sides
2. Start balancing with the most complex molecule
3. Balance one element at a time, usually leaving H and O for last
4. Use coefficients (whole numbers) in front of compounds
5. Verify that atoms of each element are equal on both sides

Note: Without specific details about the compounds, I can't provide the exact balanced equation. If you provide the complete chemical formulas, I can help balance the equation.
                    """,
                    'confidence': 0.8
                }
            
            return {
                'answer': """
To balance a chemical equation:

1. Write the unbalanced equation with correct chemical formulas
2. Count the number of atoms of each element on both sides
3. Add coefficients (whole numbers) in front of compounds to equalize atoms
4. Start with the most complex molecule or unique elements
5. Balance one element at a time, usually leaving H and O for last
6. Verify that atoms of each element are equal on both sides
7. Reduce coefficients to the smallest whole-number ratio if needed

Example:
Unbalanced: CH₄ + O₂ → CO₂ + H₂O
Balanced: CH₄ + 2O₂ → CO₂ + 2H₂O

If you have a specific equation to balance, please provide it.
                """,
                'confidence': 0.9
            }
        elif 'reaction type' in question_lower or 'type of reaction' in question_lower:
            return {
                'answer': """
Major types of chemical reactions:

1. Synthesis (Combination): A + B → AB
   Example: 2H₂ + O₂ → 2H₂O

2. Decomposition: AB → A + B
   Example: 2H₂O₂ → 2H₂O + O₂

3. Single Replacement: A + BC → AC + B
   Example: Zn + 2HCl → ZnCl₂ + H₂

4. Double Replacement: AB + CD → AD + CB
   Example: AgNO₃ + NaCl → AgCl + NaNO₃

5. Combustion: Hydrocarbon + O₂ → CO₂ + H₂O
   Example: CH₄ + 2O₂ → CO₂ + 2H₂O

6. Acid-Base (Neutralization): Acid + Base → Salt + Water
   Example: HCl + NaOH → NaCl + H₂O

7. Redox (Oxidation-Reduction): Involves electron transfer
   Example: 2Fe + O₂ → 2FeO

Each type follows specific patterns that help predict products and reaction behavior.
                """,
                'confidence': 0.95
            }
        elif 'equilibrium' in question_lower:
            return {
                'answer': """
Chemical Equilibrium occurs when forward and reverse reactions proceed at equal rates, resulting in no net change in concentrations.

Key concepts:

1. Le Chatelier's Principle: When a system at equilibrium is disturbed, it shifts to counteract the change.
   - Adding reactants/products shifts away from the addition
   - Removing reactants/products shifts toward the removal
   - Increasing pressure shifts toward fewer gas molecules
   - Increasing temperature shifts in the endothermic direction

2. Equilibrium Constant (K):
   For reaction aA + bB ⇌ cC + dD:
   K = [C]^c[D]^d / [A]^a[B]^b
   
   - K > 1: Products favored
   - K < 1: Reactants favored
   - K depends only on temperature, not concentrations

3. Reaction Quotient (Q): Same form as K but for non-equilibrium conditions
   - Q < K: Reaction proceeds forward
   - Q > K: Reaction proceeds backward
   - Q = K: System at equilibrium
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Chemical reactions involve the transformation of substances (reactants) into different substances (products) through the breaking and forming of chemical bonds. These reactions can be classified into different types, follow specific mechanisms, and are governed by principles like thermodynamics and kinetics. Could you specify which aspect of chemical reactions you're interested in?",
                'confidence': 0.7
            }
    
    def _chemical_bonding(self, question):
        """Handle questions about chemical bonding"""
        question_lower = question.lower()
        
        if 'covalent' in question_lower:
            return {
                'answer': """
Covalent bonds form when atoms share electrons to achieve a stable electron configuration.

Key characteristics:
- Formed between nonmetals
- Electrons are shared, not transferred
- Bond strength varies with the number of shared electrons:
  * Single bond (1 pair): weakest
  * Double bond (2 pairs): intermediate
  * Triple bond (3 pairs): strongest
- Bond polarity depends on electronegativity difference:
  * Nonpolar: equal sharing (e.g., H₂, O₂)
  * Polar: unequal sharing (e.g., H₂O, NH₃)

Covalent compounds typically:
- Have low melting and boiling points
- Don't conduct electricity in solution
- Form discrete molecules rather than lattices
                """,
                'confidence': 0.9
            }
        elif 'ionic' in question_lower:
            return {
                'answer': """
Ionic bonds form when electrons are transferred from a metal to a nonmetal, creating oppositely charged ions that attract each other.

Key characteristics:
- Formed between metals and nonmetals
- Complete transfer of electrons (not sharing)
- Electrostatic attraction between positive and negative ions
- Forms crystal lattices rather than discrete molecules
- Bond strength depends on ion charges and sizes

Ionic compounds typically:
- Have high melting and boiling points
- Conduct electricity when dissolved in water or melted
- Are brittle solids at room temperature
- Are soluble in polar solvents like water

Examples: NaCl (table salt), CaCO₃ (limestone), MgO (magnesia)
                """,
                'confidence': 0.9
            }
        elif 'orbital' in question_lower or 'hybridization' in question_lower:
            return {
                'answer': """
Orbital hybridization explains molecular geometry by mixing atomic orbitals to form new hybrid orbitals.

Common hybridization types:

1. sp³ hybridization:
   - Mixes one s and three p orbitals
   - Forms four equivalent orbitals arranged tetrahedrally
   - Bond angle: 109.5°
   - Examples: CH₄, NH₃, H₂O

2. sp² hybridization:
   - Mixes one s and two p orbitals
   - Forms three equivalent orbitals in a trigonal planar arrangement
   - Bond angle: 120°
   - Examples: C₂H₄, BF₃, formaldehyde

3. sp hybridization:
   - Mixes one s and one p orbital
   - Forms two equivalent orbitals in a linear arrangement
   - Bond angle: 180°
   - Examples: C₂H₂, CO₂, HCN

Hybridization helps explain both molecular shape and reactivity.
                """,
                'confidence': 0.9
            }
        else:
            return {
                'answer': "Chemical bonding involves the attraction between atoms, ions, or molecules that enables the formation of chemical compounds. The main types are ionic bonds (electron transfer), covalent bonds (electron sharing), metallic bonds, and intermolecular forces. The type of bonding determines physical and chemical properties of substances. Could you specify which aspect of chemical bonding you're interested in?",
                'confidence': 0.7
            }
    
    # Helper methods for element information
    def _get_element_type(self, symbol):
        """Return the element type (metal, nonmetal, etc.)"""
        metals = ['Li', 'Be', 'Na', 'Mg', 'K', 'Ca', 'Al']
        nonmetals = ['H', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl']
        noble_gases = ['He', 'Ne', 'Ar']
        
        if symbol in metals:
            return "Metal"
        elif symbol in nonmetals:
            return "Nonmetal"
        elif symbol in noble_gases:
            return "Noble Gas"
        else:
            return "Varies"
    
    def _get_atomic_number(self, symbol):
        """Return the atomic number for common elements"""
        atomic_numbers = {
            'H': 1, 'He': 2, 'Li': 3, 'Be': 4, 'B': 5, 'C': 6, 'N': 7, 'O': 8,
            'F': 9, 'Ne': 10, 'Na': 11, 'Mg': 12, 'Al': 13, 'Si': 14, 'P': 15,
            'S': 16, 'Cl': 17, 'Ar': 18, 'K': 19, 'Ca': 20
        }
        return atomic_numbers.get(symbol, "Unknown")
    
    def _get_atomic_weight(self, symbol):
        """Return the atomic weight for common elements"""
        atomic_weights = {
            'H': 1.008, 'He': 4.003, 'Li': 6.941, 'Be': 9.012, 'B': 10.811,
            'C': 12.011, 'N': 14.007, 'O': 15.999, 'F': 18.998, 'Ne': 20.180,
            'Na': 22.990, 'Mg': 24.305, 'Al': 26.982, 'Si': 28.086, 'P': 30.974,
            'S': 32.065, 'Cl': 35.453, 'Ar': 39.948, 'K': 39.098, 'Ca': 40.078
        }
        return atomic_weights.get(symbol, "Unknown")
    
    def _get_electron_config(self, symbol):
        """Return the electron configuration for common elements"""
        electron_configs = {
            'H': '1s¹', 'He': '1s²', 'Li': '[He]2s¹', 'Be': '[He]2s²',
            'B': '[He]2s²2p¹', 'C': '[He]2s²2p²', 'N': '[He]2s²2p³',
            'O': '[He]2s²2p⁴', 'F': '[He]2s²2p⁵', 'Ne': '[He]2s²2p⁶',
            'Na': '[Ne]3s¹', 'Mg': '[Ne]3s²', 'Al': '[Ne]3s²3p¹',
            'Si': '[Ne]3s²3p²', 'P': '[Ne]3s²3p³', 'S': '[Ne]3s²3p⁴',
            'Cl': '[Ne]3s²3p⁵', 'Ar': '[Ne]3s²3p⁶', 'K': '[Ar]4s¹',
            'Ca': '[Ar]4s²'
        }
        return electron_configs.get(symbol, "Complex configuration")
    
    def _get_oxidation_states(self, symbol):
        """Return common oxidation states for elements"""
        oxidation_states = {
            'H': '+1, -1', 'He': '0', 'Li': '+1', 'Be': '+2', 'B': '+3',
            'C': '-4, -3, -2, -1, 0, +1, +2, +3, +4', 'N': '-3 to +5',
            'O': '-2, -1, +1, +2', 'F': '-1', 'Ne': '0', 'Na': '+1',
            'Mg': '+2', 'Al': '+3', 'Si': '-4, +2, +4', 'P': '-3, +3, +5',
            'S': '-2, +2, +4, +6', 'Cl': '-1, +1, +3, +5, +7', 'Ar': '0',
            'K': '+1', 'Ca': '+2'
        }
        return oxidation_states.get(symbol, "Various")

