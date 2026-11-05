import React, { useState, useEffect } from 'react';
import {
  getSupersonicTrailConfig,
  subscribeSupersonicTrailConfig,
} from '../../config/supersonicTrailConfig';
import { SupersonicTrailHeaderAndActivationSection } from './supersonic-trail-tuner/SupersonicTrailHeaderAndActivationSection';
import { SupersonicTrailThreePointGradientSection } from './supersonic-trail-tuner/SupersonicTrailThreePointGradientSection';
import { SupersonicTrailGeometryAndCameraTiltSection } from './supersonic-trail-tuner/SupersonicTrailGeometryAndCameraTiltSection';

export interface SupersonicTrailTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

export const SupersonicTrailTunerFloatingWindow: React.FC<
  SupersonicTrailTunerFloatingWindowProps
> = ({ isLight = false }) => {
  const [cfg, setCfg] = useState(() => getSupersonicTrailConfig());

  useEffect(() => {
    return subscribeSupersonicTrailConfig((next) => {
      setCfg(next);
    });
  }, []);

  return (
    <div className="flex flex-col gap-2.5 h-full select-none text-xs pb-2 overflow-y-auto pr-0.5">
      <SupersonicTrailHeaderAndActivationSection cfg={cfg} isLight={isLight} />
      <SupersonicTrailThreePointGradientSection cfg={cfg} isLight={isLight} />
      <SupersonicTrailGeometryAndCameraTiltSection cfg={cfg} isLight={isLight} />
    </div>
  );
};
