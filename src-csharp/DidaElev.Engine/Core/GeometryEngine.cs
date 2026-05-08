using System;
using DidaElev.Engine.Models;

namespace DidaElev.Engine.Core
{
    public class GeometryEngine
    {
        public AssemblyGeometry GenerateAssembly(ElevatorConfig config)
        {
            var assembly = new AssemblyGeometry();
            
            // Dimensions
            float cw = (float)config.Cab.Width;
            float ch = (float)config.Cab.Height;
            float cd = (float)config.Cab.Depth;
            float hw = (float)config.Hoistway.Width;
            float hd = (float)config.Hoistway.Depth;
            float wt = (float)config.Hoistway.WallThickness;
            float pit = (float)config.Hoistway.PitDepth;
            float oh = (float)config.Hoistway.Overhead;
            float dbg = (float)config.Hoistway.Dbg;
            
            // 1. SIL GAP & POSITIONAL LOGIC
            // Target sill gap: 30mm (0.03m) from interior wall face
            float sillGap = 0.03f;
            float cabZ = (hd / 2.0f - sillGap) - (cd / 2.0f);
            
            // 2. Cab Assembly
            float ct = 0.02f;
            assembly.Meshes.Add(CreateBoxMesh("CabFloor", cw, 0.05f, cd, "steel", 0, -0.025f, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabBackWall", cw, ch, ct, "stainless_steel", 0, ch/2, -cd/2 + cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabLeftWall", ct, ch, cd, "stainless_steel", -cw/2, ch/2, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabRightWall", ct, ch, cd, "stainless_steel", cw/2, ch/2, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabCeiling", cw, 0.02f, cd, "stainless_steel", 0, ch, cabZ));
            
            // Cab Doors (Center Opening)
            float doorW = cw / 2.0f - 0.02f;
            assembly.Meshes.Add(CreateBoxMesh("CabDoor_L", doorW, ch - 0.05f, 0.03f, "stainless_steel", -doorW/2 - 0.01f, ch/2, cd/2 + cabZ + 0.02f));
            assembly.Meshes.Add(CreateBoxMesh("CabDoor_R", doorW, ch - 0.05f, 0.03f, "stainless_steel", doorW/2 + 0.01f, ch/2, cd/2 + cabZ + 0.02f));

            // Cab Pulleys & Crosshead Beam (Aligned with Rails)
            float pulleyX = dbg / 2.0f;
            assembly.Meshes.Add(CreateBoxMesh("CabCrosshead", dbg + 0.2f, 0.2f, 0.2f, "iron", 0, ch + 0.1f, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabPulley_L", 0.1f, 0.5f, 0.5f, "iron", -pulleyX, ch + 0.3f, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CabPulley_R", 0.1f, 0.5f, 0.5f, "iron", pulleyX, ch + 0.3f, cabZ));
            
            // Apron (Toe Guard)
            assembly.Meshes.Add(CreateBoxMesh("Apron", cw, 0.75f, 0.01f, "steel", 0, -0.4f, cd/2 + cabZ));

            // 3. Hoistway, Pit & Roof
            float tt = 0;
            foreach (var h in config.Performance.FloorHeightsMm) tt += (float)(h / 1000.0);
            float shaftH = pit + tt + oh;

            assembly.Meshes.Add(CreateBoxMesh("HoistwayBack", hw + wt*2, shaftH, wt, "concrete", 0, shaftH/2 - pit, -(hd/2 + wt/2)));
            assembly.Meshes.Add(CreateBoxMesh("HoistwayLeft", wt, shaftH, hd + wt*2, "concrete", -(hw/2 + wt/2), shaftH/2 - pit, 0));
            assembly.Meshes.Add(CreateBoxMesh("HoistwayRight", wt, shaftH, hd + wt*2, "concrete", (hw/2 + wt/2), shaftH/2 - pit, 0));
            assembly.Meshes.Add(CreateBoxMesh("PitFloor", hw + wt*2, wt, hd + wt*2, "concrete", 0, -pit - wt/2, 0));
            assembly.Meshes.Add(CreateBoxMesh("ShaftRoof", hw + wt*2, wt, hd + wt*2, "concrete", 0, shaftH - pit + wt/2, 0));

            // 4. Machine Room & Equipment
            if (config.Hoistway.MachineRoomLocation == "Top")
            {
                float mrY = shaftH - pit + 0.1f;
                assembly.Meshes.Add(CreateBoxMesh("MRFloor", hw + wt*2, 0.2f, hd + wt*2, "concrete", 0, mrY, 0));
                assembly.Meshes.Add(CreateBoxMesh("MachineBedplate", 1.2f, 0.15f, 1.0f, "iron", 0, mrY + 0.2f, 0.1f));
                assembly.Meshes.Add(CreateBoxMesh("MachineMotorBody", 0.6f, 0.6f, 0.6f, "steel", 0, mrY + 0.6f, 0.1f));
                assembly.Meshes.Add(CreateBoxMesh("MachineSheave", 0.1f, 0.7f, 0.7f, "copper", 0.35f, mrY + 0.6f, 0.1f));
                assembly.Meshes.Add(CreateBoxMesh("GovernorBase", 0.2f, 0.4f, 0.2f, "steel", -0.5f, mrY + 0.3f, -0.4f));
                assembly.Meshes.Add(CreateBoxMesh("GovernorWheel", 0.05f, 0.45f, 0.45f, "iron", -0.5f, mrY + 0.5f, -0.4f));
                assembly.Meshes.Add(CreateBoxMesh("ControlCabinet", 0.7f, 1.9f, 0.5f, "plastic", (hw/2) - 0.5f, mrY + 1.1f, -(hd/2) + 0.4f));
            }

            // 5. Counterweight System
            float cwOffRaw = (float)config.Hoistway.CwDistance;
            float cwD = 0.2f;
            float maxCwOff = (hd / 2.0f) - (cwD / 2.0f) - 0.05f;
            float cwOff = -Math.Min(cwOffRaw, maxCwOff);
            float cwW = cw * 0.75f;
            float cwH = 2.8f;
            float cwY = tt + 1.2f;
            assembly.Meshes.Add(CreateBoxMesh("CWFrame_Top", cwW, 0.1f, cwD, "steel", 0, cwY + cwH/2, cwOff));
            assembly.Meshes.Add(CreateBoxMesh("CWFrame_Bottom", cwW, 0.1f, cwD, "steel", 0, cwY - cwH/2, cwOff));
            assembly.Meshes.Add(CreateBoxMesh("CWFrame_Left", 0.1f, cwH, cwD, "steel", -cwW/2, cwY, cwOff));
            assembly.Meshes.Add(CreateBoxMesh("CWFrame_Right", 0.1f, cwH, cwD, "steel", cwW/2, cwY, cwOff));
            assembly.Meshes.Add(CreateBoxMesh("CWFillerWeights", cwW - 0.2f, cwH - 0.6f, cwD - 0.05f, "iron", 0, cwY, cwOff));

            // 6. Guide Rails & Pit
            assembly.Meshes.Add(CreateBoxMesh("RailLeft", 0.08f, shaftH, 0.06f, "steel", -dbg/2, shaftH/2 - pit, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("RailRight", 0.08f, shaftH, 0.06f, "steel", dbg/2, shaftH/2 - pit, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CarBufferBase", 0.3f, 0.1f, 0.3f, "iron", 0, -pit + 0.05f, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CarBufferSpring", 0.15f, 0.5f, 0.15f, "steel", 0, -pit + 0.35f, cabZ));
            assembly.Meshes.Add(CreateBoxMesh("CWBufferBase", 0.3f, 0.1f, 0.3f, "iron", 0, -pit + 0.05f, cwOff));
            assembly.Meshes.Add(CreateBoxMesh("CWBufferSpring", 0.15f, 0.5f, 0.15f, "steel", 0, -pit + 0.35f, cwOff));

            // 7. Suspension Ropes (Moved to Rails)
            for (int r = 0; r < 4; r++)
            {
                float rx = -0.05f + (r * 0.03f); // Tight cluster
                // Dead end anchor to Cab Pulley (at Rail L)
                assembly.Meshes.Add(CreateBoxMesh($"RopeAnchor_Cab_{r}", 0.01f, shaftH, 0.01f, "steel", -pulleyX + rx, shaftH/2 - pit, cabZ));
                // Cab Pulley to Machine Sheave (at Rail R)
                assembly.Meshes.Add(CreateBoxMesh($"RopeCab_Machine_{r}", 0.01f, shaftH, 0.01f, "steel", pulleyX + rx, shaftH/2 - pit, 0.1f));
                // Machine Sheave to CW
                assembly.Meshes.Add(CreateBoxMesh($"RopeMachine_CW_{r}", 0.01f, shaftH, 0.01f, "steel", rx, shaftH/2 - pit, cwOff));
            }

            // 8. Landing Doors
            float currentY = 0;
            for (int i = 0; i < config.Performance.Stops; i++)
            {
                assembly.Meshes.Add(CreateBoxMesh($"LandingDoor_{i}", cw, ch, 0.05f, "stainless_steel", 0, currentY + ch/2, hd/2 + wt/2));
                if (i < config.Performance.FloorHeightsMm.Count) currentY += (float)(config.Performance.FloorHeightsMm[i] / 1000.0);
            }

            return assembly;
        }

        private MeshData CreateBoxMesh(string name, float w, float h, float d, string material, float x = 0, float y = 0, float z = 0)
        {
            float hw = w / 2; float hh = h / 2; float hd = d / 2;
            return new MeshData
            {
                Name = name,
                Material = material,
                Vertices = new float[] {
                    -hw + x, -hh + y,  hd + z,  hw + x, -hh + y,  hd + z,  hw + x,  hh + y,  hd + z, -hw + x,  hh + y,  hd + z,
                    -hw + x, -hh + y, -hd + z, -hw + x,  hh + y, -hd + z,  hw + x,  hh + y, -hd + z,  hw + x, -hh + y, -hd + z,
                    -hw + x,  hh + y, -hd + z, -hw + x,  hh + y,  hd + z,  hw + x,  hh + y,  hd + z,  hw + x,  hh + y, -hd + z,
                    -hw + x, -hh + y, -hd + z,  hw + x, -hh + y, -hd + z,  hw + x, -hh + y,  hd + z, -hw + x, -hh + y,  hd + z,
                     hw + x, -hh + y, -hd + z,  hw + x,  hh + y, -hd + z,  hw + x,  hh + y,  hd + z,  hw + x, -hh + y,  hd + z,
                    -hw + x, -hh + y, -hd + z, -hw + x, -hh + y,  hd + z, -hw + x,  hh + y,  hd + z, -hw + x,  hh + y, -hd + z
                },
                Indices = new int[] {
                    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
                }
            };
        }
    }
}
