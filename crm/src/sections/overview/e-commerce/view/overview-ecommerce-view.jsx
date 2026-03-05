import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { MotivationIllustration } from 'src/assets/illustrations';
import {
  _ecommerceNewProducts,
  _ecommerceBestSalesman,
  _ecommerceSalesOverview,
  _ecommerceLatestProducts,
} from 'src/_mock';

import { useMockedUser } from 'src/auth/hooks';

import { EcommerceWelcome } from '../ecommerce-welcome';
import { EcommerceNewProducts } from '../ecommerce-new-products';
import { EcommerceYearlySales } from '../ecommerce-yearly-sales';
import { EcommerceBestSalesman } from '../ecommerce-best-salesman';
import { EcommerceSaleByGender } from '../ecommerce-sale-by-gender';
import { EcommerceSalesOverview } from '../ecommerce-sales-overview';
import { EcommerceWidgetSummary } from '../ecommerce-widget-summary';
import { EcommerceLatestProducts } from '../ecommerce-latest-products';
import { EcommerceCurrentBalance } from '../ecommerce-current-balance';

// ----------------------------------------------------------------------

export function OverviewEcommerceView() {
  const { user } = useMockedUser();

  const theme = useTheme();

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <EcommerceWelcome
            title={`Xin chào 🎉  \n ${user?.displayName}`}
            description="Doanh số tháng này đã tăng 57.6% so với cùng kỳ."
            img={<MotivationIllustration hideBackground />}
            action={
              <Button variant="contained" color="primary">
                Xem ngay
              </Button>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <EcommerceNewProducts list={_ecommerceNewProducts} />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <EcommerceWidgetSummary
            title="Sản phẩm bán"
            percent={2.6}
            total={765}
            chart={{
              categories: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <EcommerceWidgetSummary
            title="Tổng doanh thu"
            percent={-0.1}
            total={18765}
            chart={{
              colors: [theme.palette.warning.light, theme.palette.warning.main],
              categories: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8'],
              series: [56, 47, 40, 62, 73, 30, 23, 54],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <EcommerceWidgetSummary
            title="Lợi nhuận"
            percent={0.6}
            total={4876}
            chart={{
              colors: [theme.palette.error.light, theme.palette.error.main],
              categories: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8'],
              series: [40, 70, 75, 70, 50, 28, 7, 64],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <EcommerceSaleByGender
            title="Doanh số theo nhóm"
            total={2324}
            chart={{
              series: [
                { label: 'In Nhanh', value: 25 },
                { label: 'In Offset', value: 50 },
                { label: 'In Khổ Lớn', value: 75 },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <EcommerceYearlySales
            title="Doanh số theo năm"
            subheader="(+43%) so với năm trước"
            chart={{
              categories: [
                'Th1',
                'Th2',
                'Th3',
                'Th4',
                'Th5',
                'Th6',
                'Th7',
                'Th8',
                'Th9',
                'Th10',
                'Th11',
                'Th12',
              ],
              series: [
                {
                  name: '2022',
                  data: [
                    {
                      name: 'Tổng thu',
                      data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                    },
                    {
                      name: 'Tổng chi',
                      data: [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                    },
                  ],
                },
                {
                  name: '2023',
                  data: [
                    {
                      name: 'Tổng thu',
                      data: [51, 35, 41, 10, 91, 69, 62, 148, 91, 69, 62, 49],
                    },
                    {
                      name: 'Tổng chi',
                      data: [56, 13, 34, 10, 77, 99, 88, 45, 77, 99, 88, 77],
                    },
                  ],
                },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <EcommerceSalesOverview title="Tổng quan doanh số" data={_ecommerceSalesOverview} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <EcommerceCurrentBalance
            title="Số dư hiện tại"
            earning={25500}
            refunded={1600}
            orderTotal={287650}
            currentBalance={187650}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <EcommerceBestSalesman
            title="Nhân viên xuất sắc"
            tableData={_ecommerceBestSalesman}
            headCells={[
              { id: 'name', label: 'Nhân viên' },
              { id: 'category', label: 'Sản phẩm' },
              { id: 'country', label: 'Khu vực', align: 'center' },
              { id: 'totalAmount', label: 'Tổng tiền', align: 'right' },
              { id: 'rank', label: 'Xếp hạng', align: 'right' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <EcommerceLatestProducts title="Sản phẩm mới nhất" list={_ecommerceLatestProducts} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
