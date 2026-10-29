import React from 'react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { UnderConstructionPlaceholder } from '../primitives/UnderConstructionPlaceholder';
import { useMenuLayoutStore } from '../tokens/menuLayoutStore';

export interface Layer3CustomPlayRecipeProps {
  isLight?: boolean;
  title?: string;
  description?: string;
  onBack?: () => void;
  className?: string;
}

/**
 * [Recipe] Layer 3 Custom Play (In Development)
 * Displays the Hammer + IN DEVELOPMENT placeholder inside a standard Layer 3 PanelContainer.
 */
export const Layer3CustomPlayRecipe: React.FC<Layer3CustomPlayRecipeProps> = React.memo(({
  isLight = true,
  title = 'CUSTOM',
  description = 'Custom game modes, mutator presets, and workshop rule builders are currently in development.',
  onBack = () => {},
  className = '',
}) => {
  const sizing = useMenuLayoutStore((s) => s.panels['layer3-custom-play']);

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title={title}
        onBack={onBack}
      />

      <PanelContent scrollable={false} className="flex flex-col items-center justify-center">
        <UnderConstructionPlaceholder
          isLight={isLight}
          badge="IN DEVELOPMENT"
          title="In Development"
          description={description}
        />
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription={description}
      />
    </PanelContainer>
  );
});

Layer3CustomPlayRecipe.displayName = 'Layer3CustomPlayRecipe';
