import React from 'react';
import { ColorChannelAdjustments } from '@/lib/types';
import ModernSlider from './ModernSlider';

interface ChannelMixerProps {
  hueChannels: ColorChannelAdjustments;
  saturationChannels: ColorChannelAdjustments;
  luminanceChannels: ColorChannelAdjustments;
  onChannelChange: (
    type: 'hueChannels' | 'saturationChannels' | 'luminanceChannels',
    channel: 'red' | 'green' | 'blue',
    value: number[]
  ) => void;
  disabled?: boolean;
}

const defaultChannelValue = [0];

export default function ChannelMixer({
  hueChannels = { red: defaultChannelValue, green: defaultChannelValue, blue: defaultChannelValue },
  saturationChannels = { red: defaultChannelValue, green: defaultChannelValue, blue: defaultChannelValue },
  luminanceChannels = { red: defaultChannelValue, green: defaultChannelValue, blue: defaultChannelValue },
  onChannelChange,
  disabled = false
}: ChannelMixerProps) {
  const channelGroups = [
    {
      title: 'Hue',
      type: 'hueChannels' as const,
      values: hueChannels,
      min: -180,
      max: 180,
      step: 1,
      unit: '°'
    },
    {
      title: 'Saturation',
      type: 'saturationChannels' as const,
      values: saturationChannels,
      min: -100,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      title: 'Luminance',
      type: 'luminanceChannels' as const,
      values: luminanceChannels,
      min: -100,
      max: 100,
      step: 1,
      unit: '%'
    }
  ];

  const channels = ['red', 'green', 'blue'] as const;

  const getChannelValue = (values: ColorChannelAdjustments, channel: 'red' | 'green' | 'blue'): number => {
    return (values[channel]?.[0] ?? 0);
  };

  return (
    <div className="space-y-6">
      {channelGroups.map((group) => (
        <div key={group.type} className="space-y-3">
          <div className="text-sm font-medium text-gray-300">{group.title}</div>
          <div className="space-y-4">
            {channels.map((channel) => (
              <div key={channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 capitalize">{channel}</div>
                  <div className="text-xs text-gray-500">
                    {getChannelValue(group.values, channel) > 0 ? '+' : ''}
                    {getChannelValue(group.values, channel)}
                  </div>
                </div>
                <ModernSlider
                  label={`${channel} ${group.title.toLowerCase()}`}
                  value={getChannelValue(group.values, channel)}
                  onChange={(value) => onChannelChange(group.type, channel, [value])}
                  min={group.min}
                  max={group.max}
                  step={group.step}
                  unit={group.unit}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 