using Common;

namespace Application.Models.DataGrid
{
    public class TimeFilter<T> : Filter<T>
    {
        public TimeDirection Direction = TimeDirection.Before;
        public long? Number = 1;
        public TimeUnit Unit = TimeUnit.Hours;
    }
}
