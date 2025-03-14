import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { getSalesReport } from "../../store/slices/ordersSlice";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  getYear,
  getMonth,
} from "date-fns";
import { formatCurrency } from "../../utils/formatters";

// Interface for the TabPanel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Interface for daily sales data
interface DailySalesData {
  date: string;
  total: number;
  cash: number;
  card: number;
}

// Interface for payment method data
interface PaymentMethodData {
  name: string;
  value: number;
}

// Interface for category sales data
interface CategorySalesData {
  category: string;
  sales: number;
}

const Reports: React.FC = () => {
  const dispatch = useAppDispatch();
  const { salesReport, loading, error } = useAppSelector(
    (state) => state.orders
  );

  // State for date selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(new Date())
  );

  // State for tab selection
  const [tabValue, setTabValue] = useState(0);

  // Derived data for charts
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<
    PaymentMethodData[]
  >([]);
  const [categorySalesData, setCategorySalesData] = useState<
    CategorySalesData[]
  >([]);

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle year change
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(Number(event.target.value));
    updateSelectedDate(Number(event.target.value), selectedMonth);
  };

  // Handle month change
  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setSelectedMonth(Number(event.target.value));
    updateSelectedDate(selectedYear, Number(event.target.value));
  };

  // Update selected date based on year and month
  const updateSelectedDate = (year: number, month: number) => {
    const newDate = new Date(year, month, 1);
    setSelectedDate(newDate);
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const prevMonth = subMonths(selectedDate, 1);
    setSelectedDate(prevMonth);
    setSelectedYear(getYear(prevMonth));
    setSelectedMonth(getMonth(prevMonth));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    setSelectedDate(nextMonth);
    setSelectedYear(getYear(nextMonth));
    setSelectedMonth(getMonth(nextMonth));
  };

  // Fetch sales report data when selected date changes
  useEffect(() => {
    dispatch(
      getSalesReport({
        year: selectedYear,
        month: selectedMonth + 1, // JavaScript months are 0-indexed, but our API expects 1-indexed
      })
    );
  }, [dispatch, selectedYear, selectedMonth]);

  // Process sales data for charts when salesReport changes
  useEffect(() => {
    if (salesReport && salesReport.orders) {
      // Process daily sales data
      const dailyMap = new Map<
        string,
        { total: number; cash: number; card: number }
      >();

      // Initialize with all days in the month
      const daysInMonth = endOfMonth(selectedDate).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(selectedYear, selectedMonth, i);
        const dateStr = format(date, "yyyy-MM-dd");
        dailyMap.set(dateStr, { total: 0, cash: 0, card: 0 });
      }

      // Fill with actual data
      salesReport.orders.forEach((order: any) => {
        const orderDate = format(new Date(order.createdAt), "yyyy-MM-dd");
        const existing = dailyMap.get(orderDate) || {
          total: 0,
          cash: 0,
          card: 0,
        };

        existing.total += order.totalAmount;

        if (order.paymentMethod === "CASH") {
          existing.cash += order.totalAmount;
        } else if (order.paymentMethod === "CARD") {
          existing.card += order.totalAmount;
        }

        dailyMap.set(orderDate, existing);
      });

      // Convert map to array and sort by date
      const dailyData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date: format(new Date(date), "dd MMM"),
          total: data.total,
          cash: data.cash,
          card: data.card,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });

      setDailySalesData(dailyData);

      // Process payment method data
      const paymentData: PaymentMethodData[] = [
        { name: "Cash", value: salesReport.salesByPaymentMethod.CASH || 0 },
        { name: "Card", value: salesReport.salesByPaymentMethod.CARD || 0 },
      ];

      setPaymentMethodData(paymentData);

      // Process category sales data
      const categoryMap = new Map<string, number>();

      salesReport.orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          if (item.part && item.part.category) {
            const categoryName = item.part.category.name;
            const amount = item.price * item.quantity;
            const existing = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, existing + amount);
          }
        });
      });

      const categoryData = Array.from(categoryMap.entries())
        .map(([category, sales]) => ({ category, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5); // Top 5 categories

      setCategorySalesData(categoryData);
    } else {
      // If no orders data is available, set empty arrays
      setDailySalesData([]);
      setPaymentMethodData([
        { name: "Cash", value: 0 },
        { name: "Card", value: 0 },
      ]);
      setCategorySalesData([]);
    }
  }, [salesReport, selectedDate, selectedMonth, selectedYear]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="h6">
              {format(selectedDate, "MMMM yyyy")}
            </Typography>
          </Grid>
          <Grid item xs>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="year-select-label">Year</InputLabel>
                <Select
                  labelId="year-select-label"
                  value={selectedYear}
                  label="Year"
                  onChange={handleYearChange}
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => getYear(new Date()) - 2 + i
                  ).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="month-select-label">Month</InputLabel>
                <Select
                  labelId="month-select-label"
                  value={selectedMonth}
                  label="Month"
                  onChange={handleMonthChange}
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                    <MenuItem key={month} value={month}>
                      {format(new Date(2000, month, 1), "MMMM")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Total Sales" />
                <CardContent>
                  <Typography variant="h4">
                    {formatCurrency(salesReport?.totalSales || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Cash Sales" />
                <CardContent>
                  <Typography variant="h4">
                    {formatCurrency(
                      salesReport?.salesByPaymentMethod?.CASH || 0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Card Sales" />
                <CardContent>
                  <Typography variant="h4">
                    {formatCurrency(
                      salesReport?.salesByPaymentMethod?.CARD || 0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for different chart views */}
          <Paper sx={{ width: "100%", mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="report tabs"
              centered
            >
              <Tab label="Daily Sales" />
              <Tab label="Payment Methods" />
              <Tab label="Top Categories" />
              <Tab label="Detailed Data" />
            </Tabs>

            {/* Daily Sales Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Daily Sales for {format(selectedDate, "MMMM yyyy")}
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailySalesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar
                      dataKey="cash"
                      name="Cash"
                      fill="#0088FE"
                      stackId="a"
                    />
                    <Bar
                      dataKey="card"
                      name="Card"
                      fill="#00C49F"
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>

            {/* Payment Methods Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Sales by Payment Method for {format(selectedDate, "MMMM yyyy")}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Payment Method</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentMethodData.map((row) => {
                          const total = paymentMethodData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          );
                          const percentage =
                            total > 0 ? (row.value / total) * 100 : 0;

                          return (
                            <TableRow key={row.name}>
                              <TableCell component="th" scope="row">
                                {row.name}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(row.value)}
                              </TableCell>
                              <TableCell align="right">
                                {percentage.toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell component="th" scope="row">
                            <strong>Total</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              {formatCurrency(
                                paymentMethodData.reduce(
                                  (sum, item) => sum + item.value,
                                  0
                                )
                              )}
                            </strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>100%</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Top Categories Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Top Categories by Sales for {format(selectedDate, "MMMM yyyy")}
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categorySalesData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>

            {/* Detailed Data Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Detailed Sales Data for {format(selectedDate, "MMMM yyyy")}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Cash Sales</TableCell>
                      <TableCell align="right">Card Sales</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailySalesData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell component="th" scope="row">
                          {row.date}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.cash)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.card)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Total</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {formatCurrency(
                            dailySalesData.reduce(
                              (sum, item) => sum + item.cash,
                              0
                            )
                          )}
                        </strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {formatCurrency(
                            dailySalesData.reduce(
                              (sum, item) => sum + item.card,
                              0
                            )
                          )}
                        </strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {formatCurrency(
                            dailySalesData.reduce(
                              (sum, item) => sum + item.total,
                              0
                            )
                          )}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reports;
