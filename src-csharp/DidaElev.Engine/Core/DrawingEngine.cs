using DidaElev.Engine.Models;

namespace DidaElev.Engine.Core
{
    public class DrawingEngine
    {
        public AssemblyDrawing GenerateDrawings(ElevatorConfig config, EngineeringResult eng)
        {
            var drawing = new AssemblyDrawing();
            double scale = 1000; // m to mm

            // Shared Dimensions
            double hw = config.Hoistway.Width * scale;
            double hd = config.Hoistway.Depth * scale;
            double wt = config.Hoistway.WallThickness * scale;
            double cw = config.Cab.Width * scale;
            double cd = config.Cab.Depth * scale;
            double ch = config.Cab.Height * scale;
            double pit = config.Hoistway.PitDepth * scale;
            double oh = config.Hoistway.Overhead * scale;
            double tsh = eng.TotalShaftHeight * scale;
            double dbg = config.Hoistway.Dbg * scale;
            double cwOff = config.Hoistway.CwDistance * scale;
            double sillGap = 30; // 30mm

            // 1. FLOOR PLAN VIEW
            var plan = new DrawingView { Name = "Floor Plan" };
            AddRect(plan, -wt, -wt, hw + wt*2, hd + wt*2, "WALL"); // Outer
            AddRect(plan, 0, 0, hw, hd, "WALL"); // Inner

            // Cab (Aligned with Sill Gap)
            double cabY = (hd / 2.0) - sillGap - cd;
            double cabX = (hw - cw) / 2.0;
            AddRect(plan, cabX, cabY, cw, cd, "CAB");
            
            // Cab Doors
            AddRect(plan, cabX + 50, hd/2 - sillGap, cw - 100, 30, "DOOR");
            
            // Landing Door
            AddRect(plan, (hw - cw)/2, hd/2 + 10, cw, wt - 20, "DOOR");

            // Counterweight
            AddRect(plan, hw/2 - (dbg * 0.4), -cwOff - 50, dbg * 0.8, 100, "CW");
            
            // Rails
            AddRect(plan, hw/2 - dbg/2 - 40, cabY + cd/2 - 15, 80, 30, "RAIL");
            AddRect(plan, hw/2 + dbg/2 - 40, cabY + cd/2 - 15, 80, 30, "RAIL");

            // Dimensions
            AddDimH(plan, 0, hw, hd + wt + 200, "SHAFT WIDTH: " + (int)hw);
            AddDimV(plan, hw + wt + 200, 0, hd, "SHAFT DEPTH: " + (int)hd);

            drawing.Views.Add(plan);

            // 2. FRONT ELEVATION VIEW
            var front = new DrawingView { Name = "Front Elevation" };
            AddRect(front, 0, 0, hw, tsh, "WALL");
            
            // Machine Room
            if (config.Hoistway.MachineRoomLocation == "Top") {
                AddRect(front, -wt, tsh, hw + wt*2, 2500, "WALL");
                AddLabel(front, hw/2, tsh + 1250, "MACHINE ROOM", "DIM");
            }

            // Pit & Floor Labels
            double currentY = pit;
            for (int i = 0; i < config.Performance.Stops; i++)
            {
                front.Entities.Add(new DrawingEntity { Type = "line", X1 = -500, Y1 = currentY, X2 = hw + 500, Y2 = currentY, Layer = "DIM" });
                AddLabel(front, hw + 600, currentY, $"LEVEL {i+1}", "DIM");
                
                // Landing Door at each floor
                AddRect(front, (hw - cw)/2, currentY, cw, ch, "DOOR");
                
                if (i < config.Performance.FloorHeightsMm.Count) currentY += config.Performance.FloorHeightsMm[i];
            }

            // Cab
            AddRect(front, cabX, pit, cw, ch, "CAB");
            AddDimV(front, -800, 0, pit, "PIT: " + (int)pit);
            AddDimV(front, -800, tsh - oh, tsh, "OVERHEAD: " + (int)oh);

            drawing.Views.Add(front);

            // 3. SIDE ELEVATION VIEW
            var side = new DrawingView { Name = "Side Elevation" };
            AddRect(side, 0, 0, hd, tsh, "WALL");
            
            // Cab & Counterweight
            AddRect(side, cabY, pit, cd, ch, "CAB");
            AddRect(side, -cwOff - 50, pit + (eng.TotalTravel * scale), 100, 2500, "CW");
            
            // Machine (Simplified)
            if (config.Hoistway.MachineRoomLocation == "Top") {
                AddRect(side, 0, tsh + 200, 800, 600, "CAB"); // Motor
            }

            drawing.Views.Add(side);

            return drawing;
        }

        private void AddRect(DrawingView view, double x, double y, double w, double h, string layer)
        {
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x, Y1 = y, X2 = x + w, Y2 = y, Layer = layer });
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x + w, Y1 = y, X2 = x + w, Y2 = y + h, Layer = layer });
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x + w, Y1 = y + h, X2 = x, Y2 = y + h, Layer = layer });
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x, Y1 = y + h, X2 = x, Y2 = y, Layer = layer });
        }

        private void AddLabel(DrawingView view, double x, double y, string text, string layer)
        {
            view.Entities.Add(new DrawingEntity { Type = "text", X1 = x, Y1 = y, Label = text, Layer = layer });
        }

        private void AddDimH(DrawingView view, double x1, double x2, double y, string label)
        {
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x1, Y1 = y, X2 = x2, Y2 = y, Layer = "DIM" });
            AddLabel(view, (x1 + x2) / 2, y + 50, label, "DIM");
        }

        private void AddDimV(DrawingView view, double x, double y1, double y2, string label)
        {
            view.Entities.Add(new DrawingEntity { Type = "line", X1 = x, Y1 = y1, X2 = x, Y2 = y2, Layer = "DIM" });
            AddLabel(view, x + 50, (y1 + y2) / 2, label, "DIM");
        }
    }
}
