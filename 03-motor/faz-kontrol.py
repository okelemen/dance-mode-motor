import subprocess, sys
import numpy as np
SR=22050
yol=sys.argv[1]
p=subprocess.run(["ffmpeg","-v","error","-i",yol,"-f","f32le","-ac","1","-ar",str(SR),"-"],stdout=subprocess.PIPE,check=True)
x=np.frombuffer(p.stdout,dtype=np.float32)[:SR*5]
# dusuk frekans enerjisi = kick
n=256
env=np.array([np.abs(x[i:i+n]).mean() for i in range(0,len(x)-n,n)])
t=np.arange(len(env))*n/SR
# tepe bul
esik=env.mean()+1.2*env.std()
tepeler=[]
i=1
while i<len(env)-1:
    if env[i]>esik and env[i]>=env[i-1] and env[i]>env[i+1]:
        tepeler.append(t[i]); i+=8
    else: i+=1
print("Ilk 5 saniyedeki vurus tepeleri (sn):")
for tt in tepeler[:12]:
    kalan=tt%0.5
    sapma=kalan if kalan<0.25 else kalan-0.5
    print(f"  {tt:6.3f}   yarim-saniye izgarasina sapma: {sapma:+.3f}")
