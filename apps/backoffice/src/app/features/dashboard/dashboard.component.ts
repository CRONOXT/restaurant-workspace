import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService, DashboardStats } from '../../core/services/stats.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private statsService = inject(StatsService);
  private cdr = inject(ChangeDetectorRef);
  
  stats: DashboardStats | null = null;
  loading = true;

  // Configuración Gráfica de Líneas
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'Ventas ($)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#2563eb',
        fill: 'origin',
        tension: 0.4
      }
    ],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  // Configuración Gráfica de Tarta
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    datasets: [{
      data: [],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }],
    labels: []
  };

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.cdr.detectChanges(); // Asegurar que el spinner se muestre

    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        
        // Actualizar gráfica de líneas (creando nuevas referencias para forzar render)
        this.lineChartData = {
          ...this.lineChartData,
          labels: data.ventasUltimaSemana.map(v => v.fecha),
          datasets: [{
            ...this.lineChartData.datasets[0],
            data: data.ventasUltimaSemana.map(v => v.total)
          }]
        };

        // Actualizar gráfica de tarta
        this.pieChartData = {
          ...this.pieChartData,
          labels: data.platosPopulares.map(p => p.nombre),
          datasets: [{
            ...this.pieChartData.datasets[0],
            data: data.platosPopulares.map(p => p.cantidad)
          }]
        };

        this.loading = false;
        this.cdr.detectChanges(); // Forzar renderizado final
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
