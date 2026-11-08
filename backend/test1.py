import numpy as np
import matplotlib.pyplot as plt

R1, R2, R3 = 40, 35, 20
L1, L2, L3 = 0.15, 0.10, 0.08
C1, C3 = 40e-6, 70e-6
U, f = 380, 50
w = 2*np.pi*f
Z1 = R1 + 1j*(w*L1-1/(w*C1))
Z2 = R2 + 1j*w*L2
Z3 = R3 + 1j*(w*L3-1/(w*C3))
Zp = Z2*Z3/(Z2+Z3)
I1 = U/(Z1+Zp)
Uab = I1*Zp
I2, I3 = Uab/Z2, Uab/Z3

fig, ax = plt.subplots(figsize=(9, 7))
colors = ['#1459a5','#e47c24','#17825c']
for name, value, color in zip(['I1','I2','I3'],[I1,I2,I3],colors):
    ax.arrow(0,0,value.real,value.imag,head_width=.13,head_length=.20,
             length_includes_head=True,color=color,linewidth=2.5)
    ax.text(value.real*1.06,value.imag*1.06,
            f'{name} = {abs(value):.3f} A, {np.degrees(np.angle(value)):+.2f}°',
            color=color,fontsize=11)
ax.plot([I2.real,I1.real],[I2.imag,I1.imag],'--',color='#777777',alpha=.8)
ax.set(xlabel='Real current, A',ylabel='Imaginary current, A',
       title='Current phasor diagram — circuit 8, data variant 5')
ax.axhline(0,color='black',linewidth=.8)
ax.axvline(0,color='black',linewidth=.8)
ax.grid(alpha=.3)
ax.axis('equal')
fig.tight_layout()
fig.savefig('vector_diagram_variant_5_8.png',dpi=220,bbox_inches='tight')
plt.show()
print('I1 =',I1,'I2 =',I2,'I3 =',I3,'KCL error =',abs(I1-I2-I3))