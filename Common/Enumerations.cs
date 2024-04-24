namespace Common
{
    /// <summary>
    /// Represents sort order
    /// </summary>
    public enum Order
    {
        Ascending,
        Descending
    }

    /// <summary>
    /// Represents color transition range
    /// </summary>
    public enum ColorRange
    {
        RedToGreen,
        WhiteToGreen
    }

    /// <summary>
    /// Represents accessibility
    /// </summary>
    public enum Accessibility
    {
        FreeToPlay,
        Members
    }

    /// <summary>
    /// Represents units of time
    /// </summary>
    public enum TimeUnit
    {
        Months = 2_628_000,
        Days = 86_400,
        Hours = 3_600,
        Minutes = 60,
        Seconds = 1
    }

    /// <summary>
    /// Represents whether time interval is before or after reference time
    /// </summary>
    public enum TimeDirection
    {
        Before,
        After
    }
}
