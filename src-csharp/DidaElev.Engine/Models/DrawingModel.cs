namespace DidaElev.Engine.Models
{
    public class DrawingEntity
    {
        public string Type { get; set; } = "line"; // line, rect, circle, text
        public double X1 { get; set; }
        public double Y1 { get; set; }
        public double X2 { get; set; }
        public double Y2 { get; set; }
        public string Label { get; set; } = "";
        public string Layer { get; set; } = "default";
    }

    public class DrawingView
    {
        public string Name { get; set; } = "";
        public List<DrawingEntity> Entities { get; set; } = new();
    }

    public class AssemblyDrawing
    {
        public List<DrawingView> Views { get; set; } = new();
    }
}
