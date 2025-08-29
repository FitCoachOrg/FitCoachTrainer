import { Exercise } from './types';

export class EquipmentNoteGenerator {
  private static readonly EQUIPMENT_NOTES = {
    // Core equipment types from database
    "bodyweight": {
      note: "No equipment needed",
      tips: ["Focus on form", "Full range of motion", "Control the movement"]
    },
    "dumbbell": {
      note: "Dumbbell exercise",
      tips: ["Keep weights controlled", "Maintain balance", "Full range of motion"]
    },
    "barbell": {
      note: "Barbell exercise",
      tips: ["Proper grip", "Keep bar path straight", "Brace core"]
    },
    "cable": {
      note: "Cable exercise",
      tips: ["Maintain cable tension", "Control the movement", "Full range of motion"]
    },
    "suspension trainer": {
      note: "Suspension trainer exercise",
      tips: ["Maintain body tension", "Control the movement", "Adjust difficulty with foot position"]
    },
    "gymnastic rings": {
      note: "Gymnastic rings exercise",
      tips: ["Maintain ring stability", "Control the movement", "Focus on shoulder stability"]
    },
    "parallette bars": {
      note: "Parallette bars exercise",
      tips: ["Maintain proper hand position", "Control the movement", "Keep body aligned"]
    },
    "stability ball": {
      note: "Stability ball exercise",
      tips: ["Maintain ball stability", "Control the movement", "Engage core throughout"]
    },
    "medicine ball": {
      note: "Medicine ball exercise",
      tips: ["Control the ball", "Maintain proper form", "Focus on power transfer"]
    },
    "slam ball": {
      note: "Slam ball exercise",
      tips: ["Control the slam", "Maintain proper form", "Focus on explosive movement"]
    },
    "ab wheel": {
      note: "Ab wheel exercise",
      tips: ["Control the rollout", "Maintain core tension", "Don't let hips sag"]
    },
    "miniband": {
      note: "Miniband exercise",
      tips: ["Maintain band tension", "Control the movement", "Focus on resistance"]
    },
    "sliders": {
      note: "Slider exercise",
      tips: ["Control the slide", "Maintain stability", "Focus on smooth movement"]
    },
    "pull up bar": {
      note: "Pull-up bar exercise",
      tips: ["Proper grip", "Control the movement", "Full range of motion"]
    }
  } as const;

  /**
   * Get equipment-specific notes
   */
  static getNotes(exercise: Exercise): string {
    const equipment = exercise.equipment?.toLowerCase() || "bodyweight";
    
    // Find exact match first
    for (const [pattern, notes] of Object.entries(this.EQUIPMENT_NOTES)) {
      if (equipment === pattern) {
        return notes.note;
      }
    }
    
    // Find partial match for variations
    for (const [pattern, notes] of Object.entries(this.EQUIPMENT_NOTES)) {
      if (equipment.includes(pattern) || pattern.includes(equipment)) {
        return notes.note;
      }
    }
    
    // Handle common variations
    if (equipment.includes('dumbbell') || equipment.includes('db')) {
      return this.EQUIPMENT_NOTES.dumbbell.note;
    }
    if (equipment.includes('barbell') || equipment.includes('bb')) {
      return this.EQUIPMENT_NOTES.barbell.note;
    }
    if (equipment.includes('cable') || equipment.includes('machine')) {
      return this.EQUIPMENT_NOTES.cable.note;
    }
    if (equipment.includes('suspension') || equipment.includes('trx')) {
      return this.EQUIPMENT_NOTES["suspension trainer"].note;
    }
    if (equipment.includes('ring') || equipment.includes('gymnastic')) {
      return this.EQUIPMENT_NOTES["gymnastic rings"].note;
    }
    if (equipment.includes('parallette') || equipment.includes('parallettes')) {
      return this.EQUIPMENT_NOTES["parallette bars"].note;
    }
    if (equipment.includes('stability') || equipment.includes('swiss ball')) {
      return this.EQUIPMENT_NOTES["stability ball"].note;
    }
    if (equipment.includes('medicine') || equipment.includes('med ball')) {
      return this.EQUIPMENT_NOTES["medicine ball"].note;
    }
    if (equipment.includes('slam') || equipment.includes('wall ball')) {
      return this.EQUIPMENT_NOTES["slam ball"].note;
    }
    if (equipment.includes('ab wheel') || equipment.includes('ab roller')) {
      return this.EQUIPMENT_NOTES["ab wheel"].note;
    }
    if (equipment.includes('band') || equipment.includes('resistance')) {
      return this.EQUIPMENT_NOTES.miniband.note;
    }
    if (equipment.includes('slider') || equipment.includes('slide')) {
      return this.EQUIPMENT_NOTES.sliders.note;
    }
    if (equipment.includes('pull up') || equipment.includes('chin up')) {
      return this.EQUIPMENT_NOTES["pull up bar"].note;
    }
    
    return "Focus on proper form and control";
  }

  /**
   * Get equipment-specific tips
   */
  static getTips(exercise: Exercise): string[] {
    const equipment = exercise.equipment?.toLowerCase() || "bodyweight";
    
    // Find exact match first
    for (const [pattern, notes] of Object.entries(this.EQUIPMENT_NOTES)) {
      if (equipment === pattern) {
        return [...notes.tips]; // Convert readonly to mutable array
      }
    }
    
    // Find partial match for variations
    for (const [pattern, notes] of Object.entries(this.EQUIPMENT_NOTES)) {
      if (equipment.includes(pattern) || pattern.includes(equipment)) {
        return [...notes.tips]; // Convert readonly to mutable array
      }
    }
    
    // Handle common variations
    if (equipment.includes('dumbbell') || equipment.includes('db')) {
      return [...this.EQUIPMENT_NOTES.dumbbell.tips];
    }
    if (equipment.includes('barbell') || equipment.includes('bb')) {
      return [...this.EQUIPMENT_NOTES.barbell.tips];
    }
    if (equipment.includes('cable') || equipment.includes('machine')) {
      return [...this.EQUIPMENT_NOTES.cable.tips];
    }
    if (equipment.includes('suspension') || equipment.includes('trx')) {
      return [...this.EQUIPMENT_NOTES["suspension trainer"].tips];
    }
    if (equipment.includes('ring') || equipment.includes('gymnastic')) {
      return [...this.EQUIPMENT_NOTES["gymnastic rings"].tips];
    }
    if (equipment.includes('parallette') || equipment.includes('parallettes')) {
      return [...this.EQUIPMENT_NOTES["parallette bars"].tips];
    }
    if (equipment.includes('stability') || equipment.includes('swiss ball')) {
      return [...this.EQUIPMENT_NOTES["stability ball"].tips];
    }
    if (equipment.includes('medicine') || equipment.includes('med ball')) {
      return [...this.EQUIPMENT_NOTES["medicine ball"].tips];
    }
    if (equipment.includes('slam') || equipment.includes('wall ball')) {
      return [...this.EQUIPMENT_NOTES["slam ball"].tips];
    }
    if (equipment.includes('ab wheel') || equipment.includes('ab roller')) {
      return [...this.EQUIPMENT_NOTES["ab wheel"].tips];
    }
    if (equipment.includes('band') || equipment.includes('resistance')) {
      return [...this.EQUIPMENT_NOTES.miniband.tips];
    }
    if (equipment.includes('slider') || equipment.includes('slide')) {
      return [...this.EQUIPMENT_NOTES.sliders.tips];
    }
    if (equipment.includes('pull up') || equipment.includes('chin up')) {
      return [...this.EQUIPMENT_NOTES["pull up bar"].tips];
    }
    
    return ["Focus on proper form", "Control the movement"];
  }
}
