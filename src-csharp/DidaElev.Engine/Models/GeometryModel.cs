namespace DidaElev.Engine.Models
{
    public class MeshData
    {
        public string Name { get; set; } = "";
        public float[] Vertices { get; set; } = [];
        public float[] Normals { get; set; } = [];
        public int[] Indices { get; set; } = [];
        public string Material { get; set; } = "steel";
    }

    public class AssemblyGeometry
    {
        public List<MeshData> Meshes { get; set; } = new();
    }
}
