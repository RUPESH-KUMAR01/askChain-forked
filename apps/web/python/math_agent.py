import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr
import re

class MathAgent:
    def __init__(self):
        self.x, self.y, self.z = sp.symbols('x y z')
        self.t = sp.symbols('t')
        
    def process_question(self, question):
        """
        Process a mathematics question and return an answer.
        
        Args:
            question (str): The user's question
            
        Returns:
            dict: Response containing answer and confidence
        """
        question_lower = question.lower()
        
        # Check for different types of math problems
        if any(keyword in question_lower for keyword in ['solve', 'equation']):
            return self._solve_equation(question)
        elif any(keyword in question_lower for keyword in ['derivative', 'differentiate']):
            return self._find_derivative(question)
        elif any(keyword in question_lower for keyword in ['integral', 'integrate']):
            return self._find_integral(question)
        elif any(keyword in question_lower for keyword in ['limit']):
            return self._find_limit(question)
        elif any(keyword in question_lower for keyword in ['matrix']):
            return self._matrix_operations(question)
        else:
            # General math explanation
            return {
                'answer': "I'm not sure I understand your math question. Could you provide more details or specify what type of math problem you're trying to solve?",
                'confidence': 0.3
            }
    
    def _solve_equation(self, question):
        """Attempt to solve an equation from the question"""
        try:
            # Try to extract an equation from the question
            equation_match = re.search(r'([^=]+=[^=]+)', question)
            if equation_match:
                equation_str = equation_match.group(1)
                sides = equation_str.split('=')
                if len(sides) == 2:
                    left_side = parse_expr(sides[0].strip())
                    right_side = parse_expr(sides[1].strip())
                    equation = sp.Eq(left_side, right_side)
                    solution = sp.solve(equation)
                    return {
                        'answer': f"The solution to the equation {equation} is {solution}",
                        'confidence': 0.9
                    }
            
            return {
                'answer': "I couldn't identify a clear equation to solve. Please format your equation as 'expression = expression'.",
                'confidence': 0.5
            }
        except Exception as e:
            return {
                'answer': f"I encountered an error while trying to solve this equation: {str(e)}. Please check the format and try again.",
                'confidence': 0.3
            }
    
    def _find_derivative(self, question):
        """Find the derivative of an expression"""
        try:
            # Try to extract a function from the question
            function_match = re.search(r'derivative of ([^.?]+)', question)
            if function_match:
                function_str = function_match.group(1).strip()
                function = parse_expr(function_str)
                
                # Determine the variable to differentiate with respect to
                if 'with respect to' in question:
                    var_match = re.search(r'with respect to ([xyz])', question)
                    if var_match:
                        var_str = var_match.group(1)
                        var = sp.Symbol(var_str)
                    else:
                        var = self.x  # Default to x
                else:
                    var = self.x  # Default to x
                
                derivative = sp.diff(function, var)
                return {
                    'answer': f"The derivative of {function} with respect to {var} is {derivative}",
                    'confidence': 0.9
                }
            
            return {
                'answer': "I couldn't identify a clear function to differentiate. Please specify the function after 'derivative of'.",
                'confidence': 0.5
            }
        except Exception as e:
            return {
                'answer': f"I encountered an error while finding the derivative: {str(e)}. Please check the format and try again.",
                'confidence': 0.3
            }
    
    def _find_integral(self, question):
        """Find the integral of an expression"""
        try:
            # Try to extract a function from the question
            function_match = re.search(r'integral of ([^.?]+)', question)
            if function_match:
                function_str = function_match.group(1).strip()
                function = parse_expr(function_str)
                
                # Determine the variable to integrate with respect to
                if 'with respect to' in question:
                    var_match = re.search(r'with respect to ([xyz])', question)
                    if var_match:
                        var_str = var_match.group(1)
                        var = sp.Symbol(var_str)
                    else:
                        var = self.x  # Default to x
                else:
                    var = self.x  # Default to x
                
                integral = sp.integrate(function, var)
                return {
                    'answer': f"The integral of {function} with respect to {var} is {integral} + C",
                    'confidence': 0.9
                }
            
            return {
                'answer': "I couldn't identify a clear function to integrate. Please specify the function after 'integral of'.",
                'confidence': 0.5
            }
        except Exception as e:
            return {
                'answer': f"I encountered an error while finding the integral: {str(e)}. Please check the format and try again.",
                'confidence': 0.3
            }
    
    def _find_limit(self, question):
        """Find the limit of an expression"""
        try:
            # Try to extract a function and limit point from the question
            function_match = re.search(r'limit of ([^.?]+) as ([xyz]) approaches ([^.?]+)', question)
            if function_match:
                function_str = function_match.group(1).strip()
                var_str = function_match.group(2).strip()
                point_str = function_match.group(3).strip()
                
                function = parse_expr(function_str)
                var = sp.Symbol(var_str)
                point = parse_expr(point_str)
                
                limit = sp.limit(function, var, point)
                return {
                    'answer': f"The limit of {function} as {var} approaches {point} is {limit}",
                    'confidence': 0.9
                }
            
            return {
                'answer': "I couldn't identify a clear limit problem. Please format as 'limit of [function] as [variable] approaches [value]'.",
                'confidence': 0.5
            }
        except Exception as e:
            return {
                'answer': f"I encountered an error while finding the limit: {str(e)}. Please check the format and try again.",
                'confidence': 0.3
            }
    
    def _matrix_operations(self, question):
        """Perform matrix operations"""
        # This is a simplified implementation
        return {
            'answer': "For matrix operations, I would need the specific matrices and the operation you want to perform (addition, multiplication, determinant, inverse, etc.). Please provide these details.",
            'confidence': 0.7
        }

