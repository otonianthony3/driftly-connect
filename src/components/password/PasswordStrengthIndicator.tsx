import React, { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const strengthAnalysis = useMemo(() => analyzePasswordStrength(password), [password]);
  
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Password Strength: <span className={`font-medium ${getStrengthTextColor(strengthAnalysis.score)}`}>{strengthAnalysis.label}</span></span>
        <span className="text-xs">{strengthAnalysis.score}/10</span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getStrengthColor(strengthAnalysis.score)}`} 
          style={{ width: `${strengthAnalysis.score * 10}%` }}
        />
      </div>
      
      {strengthAnalysis.suggestions.length > 0 && (
        <ul className="mt-2 text-xs text-gray-600 space-y-1">
          {strengthAnalysis.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block mr-1">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface StrengthAnalysis {
  score: number;
  label: string;
  suggestions: string[];
}

function analyzePasswordStrength(password: string): StrengthAnalysis {
  if (!password) {
    return { score: 0, label: "", suggestions: [] };
  }
  
  // Start with baseline score
  let score = 0;
  const suggestions: string[] = [];
  
  // Length check (up to 4 points)
  if (password.length >= 12) {
    score += 4;
  } else if (password.length >= 10) {
    score += 3;
  } else if (password.length >= 8) {
    score += 2;
  } else if (password.length >= 6) {
    score += 1;
  } else {
    suggestions.push("Use at least 8 characters");
  }
  
  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  
  // Add points for character variety (up to 4 points)
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  
  // Add suggestions based on missing character types
  if (!hasLowercase) suggestions.push("Include lowercase letters");
  if (!hasUppercase) suggestions.push("Include uppercase letters");
  if (!hasNumbers) suggestions.push("Include numbers");
  if (!hasSpecialChars) suggestions.push("Include special characters (e.g., !@#$%)");
  
  // Check for common patterns (up to 2 points penalty)
  const commonPatterns = [
    /^123456/, /^password$/i, /^qwerty/i, /^admin/i, 
    /0000/, /1111/, /2222/, /3333/, /4444/, /5555/, /6666/, /7777/, /8888/, /9999/
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common patterns and sequences");
  }
  
  // Bonus points for mixed character placement (up to 2 points)
  const hasGoodMixing = (
    hasLowercase && hasUppercase && hasNumbers && 
    !password.match(/^[a-z]+[A-Z]+[0-9]+/) && 
    !password.match(/^[A-Z]+[a-z]+[0-9]+/)
  );
  
  if (hasGoodMixing) score += 2;
  else if (hasLowercase && hasUppercase && hasNumbers) {
    score += 1;
    suggestions.push("Mix character types throughout the password");
  }
  
  // Cap score at 10
  score = Math.min(10, score);
  
  // Label based on score
  let label = "";
  if (score >= 9) label = "Very Strong";
  else if (score >= 7) label = "Strong";
  else if (score >= 5) label = "Moderate";
  else if (score >= 3) label = "Weak";
  else label = "Very Weak";
  
  return { score, label, suggestions };
}

function getStrengthColor(score: number): string {
  if (score >= 9) return "bg-green-500";
  if (score >= 7) return "bg-green-400";
  if (score >= 5) return "bg-yellow-400";
  if (score >= 3) return "bg-orange-400";
  return "bg-red-500";
}

function getStrengthTextColor(score: number): string {
  if (score >= 9) return "text-green-600";
  if (score >= 7) return "text-green-500";
  if (score >= 5) return "text-yellow-600";
  if (score >= 3) return "text-orange-500";
  return "text-red-600";
}