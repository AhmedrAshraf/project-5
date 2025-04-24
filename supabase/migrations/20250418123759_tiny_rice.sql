/*
  # Update lunch time slot label
  
  1. Changes
    - Update the label of the lunch time slot from "Mittagessen" to "Lunchkarte"
    - Keep all other time slots unchanged
    
  2. Notes
    - Uses a targeted update to only modify the lunch slot
    - Maintains existing time ranges and other settings
*/

UPDATE time_slots 
SET label = 'Lunchkarte'
WHERE label = 'Mittagessen';