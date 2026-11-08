import numpy as np
import matplotlib.pyplot as plt

E, R, L, C = 15.0, 6.0, 0.1, 150e-6
alpha = R / (2 * L)
omega0 = 1 / np.sqrt(L * C)
omegad = np.sqrt(omega0**2 - alpha**2)
t_end = 4 / alpha

def current(t):
    return E / (L * omegad) * np.exp(-alpha * t) * np.sin(omegad * t)

def capacitor_voltage(t):
    return E * (1 - np.exp(-alpha * t) *
                (np.cos(omegad * t) + alpha / omegad * np.sin(omegad * t)))

t = np.linspace(0, t_end, 1500)
t_points = np.linspace(0, t_end, 13)

fig, ax = plt.subplots(figsize=(11, 5.5))
ax.plot(t, current(t), linewidth=2, label='i(t)')
ax.plot(t_points, current(t_points), 'o', markersize=4, label='13 расчётных точек')
envelope = E / (L * omegad) * np.exp(-alpha * t)
ax.plot(t, envelope, '--', linewidth=1, label='Огибающая')
ax.plot(t, -envelope, '--', linewidth=1)
ax.axhline(0, color='gray', linewidth=0.8)
ax.set(title='ПЗ №3, вариант 5 — ток в RLC-цепи', xlabel='Время, с', ylabel='Ток, А')
ax.grid(alpha=0.3)
ax.legend()
fig.tight_layout()
fig.savefig('ПЗ3_график_тока.png', dpi=220)

fig, ax = plt.subplots(figsize=(11, 5.5))
ax.plot(t, capacitor_voltage(t), linewidth=2, label='uC(t)')
ax.plot(t_points, capacitor_voltage(t_points), 'o', markersize=4, label='13 расчётных точек')
ax.axhline(E, color='gray', linestyle='--', label='Установившееся напряжение E = 15 В')
ax.set(title='ПЗ №3, вариант 5 — напряжение на конденсаторе', xlabel='Время, с', ylabel='Напряжение, В')
ax.grid(alpha=0.3)
ax.legend()
fig.tight_layout()
fig.savefig('ПЗ3_график_напряжения.png', dpi=220)
plt.show()

print(f'α = {alpha:.5f} 1/с; ω0 = {omega0:.5f} рад/с; ωd = {omegad:.5f} рад/с')
print('t, с       i(t), А       uC(t), В')
for ti in t_points:
    print(f'{ti:8.4f}    {current(ti):9.4f}    {capacitor_voltage(ti):9.3f}')