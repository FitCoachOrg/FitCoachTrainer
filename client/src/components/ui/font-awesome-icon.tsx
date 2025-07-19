import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface FontAwesomeIconProps {
  icon: IconDefinition
  className?: string
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x'
}

export const FontAwesomeIconComponent: React.FC<FontAwesomeIconProps> = ({ 
  icon, 
  className = "", 
  size = "1x" 
}) => {
  return (
    <FontAwesomeIcon 
      icon={icon} 
      className={className} 
      size={size}
    />
  )
} 