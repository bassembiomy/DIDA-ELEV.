namespace DidaElev.Engine.Models
{
    public class HoistwayConfig
    {
        public double Width { get; set; }
        public double Depth { get; set; }
        public double PitDepth { get; set; }
        public double Overhead { get; set; }
        public double WallThickness { get; set; }
        public string WallMaterial { get; set; } = "Concrete";
        public double Dbg { get; set; } // Distance Between Guides
        public double CwDistance { get; set; } // Counterweight offset
        public string MachineRoomLocation { get; set; } = "Top"; // Top, Bottom, Side, None
    }

    public class CabConfig
    {
        public double Width { get; set; }
        public double Depth { get; set; }
        public double Height { get; set; }
        public string DoorType { get; set; } = "Center Opening"; // Center, Side, Telescopic
        public double ToeGuardHeight { get; set; }
        public string CabinMaterial { get; set; } = "Steel";
        public string FloorMaterial { get; set; } = "Granite";
        public int RatedLoadKg { get; set; }
        public int PassengerCapacity { get; set; }
    }

    public class MachineConfig
    {
        public string MachineType { get; set; } = "Gearless"; // Gearless, Geared, Hydraulic
        public double SheaveDiameter { get; set; }
        public double Speed { get; set; }
        public string RopingSystem { get; set; } = "2:1 Roping"; // 1:1, 2:1, 4:1
        public int RopeCount { get; set; }
        public double RopeDiameter { get; set; }
        public double Efficiency { get; set; } = 0.85;
    }

    public class PerformanceConfig
    {
        public string ElevatorType { get; set; } = "Passenger Elevator";
        public int Stops { get; set; }
        public List<double> FloorHeightsMm { get; set; } = new();
        public double NominalSpeed { get; set; }
        public double Acceleration { get; set; } = 1.0; // m/s^2
        public double Jerk { get; set; } = 1.0; // m/s^3
    }

    public class SimulationState
    {
        public double CurrentPosition { get; set; }
        public double CurrentVelocity { get; set; }
        public double CurrentAcceleration { get; set; }
        public string DoorStatus { get; set; } = "Closed";
        public int CurrentFloor { get; set; }
    }

    public class ElevatorConfig
    {
        public HoistwayConfig Hoistway { get; set; } = new();
        public CabConfig Cab { get; set; } = new();
        public MachineConfig Machine { get; set; } = new();
        public PerformanceConfig Performance { get; set; } = new();
        public SimulationState Simulation { get; set; } = new();
    }
}
