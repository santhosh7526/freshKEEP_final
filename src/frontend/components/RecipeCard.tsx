import { Clock, ChefHat } from 'lucide-react';
import { Recipe } from '../../backend/models/types';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const difficultyColor = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#86A789]/10 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-6 h-6 text-[#86A789]" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{recipe.name}</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookTime}</span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full capitalize ${
                difficultyColor[recipe.difficulty]
              }`}
            >
              {recipe.difficulty}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Uses: {recipe.ingredients.slice(0, 3).join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
