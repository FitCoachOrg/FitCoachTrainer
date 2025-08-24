# (module code was written in the previous cell; rewriting now)
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import pandas as pd
import numpy as np

GOAL_PRESETS: Dict[str, Dict[str, float]] = {
    "fat_loss": {"rep_low":10,"rep_high":15,"rest_s":45,"sets_min":2,"sets_max":4,"tempo_s_per_rep":2.5},
    "hypertrophy": {"rep_low":8,"rep_high":12,"rest_s":75,"sets_min":3,"sets_max":4,"tempo_s_per_rep":3.0},
    "strength": {"rep_low":3,"rep_high":6,"rest_s":150,"sets_min":3,"sets_max":5,"tempo_s_per_rep":3.5},
    "endurance": {"rep_low":15,"rep_high":25,"rest_s":40,"sets_min":2,"sets_max":4,"tempo_s_per_rep":2.0},
    "power": {"rep_low":1,"rep_high":3,"rest_s":210,"sets_min":3,"sets_max":5,"tempo_s_per_rep":2.5},
    "core_stability": {"rep_low":8,"rep_high":15,"rest_s":60,"sets_min":2,"sets_max":4,"tempo_s_per_rep":2.5},
}
EXPERIENCE_ORDER = {"Beginner":0,"Intermediate":1,"Advanced":2}
DEFAULTS = {"warmup_s": 8*60, "cooldown_s": 5*60, "transition_s_per_ex": 40}
GOAL_TO_MUSCLE_BUCKETS: Dict[str, List[str]] = {
    "fat_loss": ["Full Body","Quads","Hamstrings","Glutes","Back","Chest","Shoulders","Core"],
    "hypertrophy": ["Chest","Back","Shoulders","Quads","Hamstrings","Glutes","Arms","Core","Calves"],
    "strength": ["Quads","Hamstrings","Glutes","Back","Chest","Shoulders","Core"],
    "endurance": ["Full Body","Core","Back","Quads","Glutes"],
    "power": ["Quads","Hamstrings","Glutes","Back","Shoulders","Core"],
    "core_stability": ["Core","Obliques","Lower Back"]
}
INJURY_RULES: Dict[str, List[str]] = {
    "shoulder": ["overhead press","shoulder press","push press","snatch","jerk","handstand","upright row","behind-the-neck"],
    "elbow": ["skullcrusher","lying triceps extension","close-grip bench","ez bar curl","preacher curl","dip"],
    "wrist": ["wrist curl","reverse curl","handstand","clean","snatch","front rack"],
    "neck": ["shrug","behind-the-neck","neck curl","neck extension"],
    "upper_back": ["barbell row","pendlay row","seal row","t-bar row","bent-over row"],
    "lower_back": ["deadlift","romanian deadlift","rdl","good morning","back extension","superman","hyperextension","heavy squat"],
    "hip": ["sumo deadlift","good morning","hip thrust heavy","deep squat","wide-stance"],
    "groin": ["sumo","copenhagen","side lunge","cossack","adductor"],
    "hamstring": ["nordic","good morning","romanian deadlift","hamstring curl"],
    "quad": ["sissy squat","leg extension","pistol squat","deep squat"],
    "knee": ["deep squat","sissy squat","lunge","step-up","box jump","leg extension"],
    "ankle": ["jump rope","calf raise heavy","box jump","plyometric"],
    "achilles": ["box jump","jump rope","sprint","plyometric"],
    "foot": ["sprint","box jump","jump rope","plyometric","lateral hop"]
}
UI_GOAL_MAP = {
    "Lose body fat":"fat_loss","Build muscle":"hypertrophy","Get stronger":"strength","Build endurance":"endurance",
    "Overall health":"endurance","Sport performance":"power","Tone and sculpt":"hypertrophy"
}
UI_EXPERIENCE_MAP = {
    "Complete beginner (never trained)":"Beginner",
    "Beginner\n(less than 6 months)":"Beginner",
    "Beginner (less than 6 months)":"Beginner",
    "Some experience\n(6 months - 2 years)":"Intermediate",
    "Some experience (6 months - 2 years)":"Intermediate",
    "Experienced (2-5 years)":"Intermediate",
    "Very experienced\n(5+ years)":"Advanced",
    "Very experienced (5+ years)":"Advanced",
    "Beginner":"Beginner"
}
UI_EQUIPMENT_TOKENS = {
    "Just my bodyweight":["bodyweight"],
    "Dumbbells":["dumbbell"],
    "Barbell":["barbell","bench"],
    "Resistance bands":["bands"],
    "Kettlebells":["kettlebell"],
    "Full gym access":["barbell","dumbbell","cable","machine","bench","kettlebell","bands","bodyweight","cardio_machine"],
    "Cardio machines":["cardio_machine","machine","bike","rower","treadmill","elliptical","stair"],
    "Yoga mat":["bodyweight","stability ball"]
}
UI_LOCATION_EQUIPMENT_DEFAULTS = {
    "Home":["bodyweight","bands","dumbbell","yoga_mat"],
    "Gym":UI_EQUIPMENT_TOKENS["Full gym access"],
    "Outdoors":["bodyweight","bands","kettlebell"],
    "Mix of locations":[]
}
UI_FOCUS_TO_MUSCLES = {
    "Upper body":["Chest","Back","Shoulders","Arms","Core"],
    "Lower body":["Quads","Hamstrings","Glutes","Calves","Core"],
    "Core/abs":["Core","Obliques","Lower Back"],
    "Cardio fitness":["Full Body","Core"],
    "Flexibility":["Core","Lower Back","Obliques"],
    "Full body strength":["Full Body","Core","Back","Quads","Glutes"],
    "Functional movement":["Full Body","Core","Back","Glutes"]
}
def clamp(v,lo,hi): return max(lo,min(hi,v))

from dataclasses import dataclass, field

@dataclass
class WorkoutPlanner:
    path: str | Path
    lib: pd.DataFrame = field(init=False)
    def __post_init__(self):
        p = Path(self.path)
        if p.suffix.lower()==".csv":
            self.lib = self._load_csv(p)
        else:
            self.lib = self._load_excel(p)
        self._clean_library()
    def _load_csv(self,p:Path)->pd.DataFrame:
        df = pd.read_csv(p)
        df = df.rename(columns={
            "exercise_name":"name","video_link":"video","expereince_level":"experience",
            "primary_muscle":"primary_muscle","secondary_muscle":"secondary_muscle",
            "category":"category","equipment":"equipment"
        })
        for col in ["name","primary_muscle","category","experience","equipment","video"]:
            if col not in df.columns: df[col]=np.nan
        return df
    def _load_excel(self,p:Path)->pd.DataFrame:
        xls = pd.ExcelFile(p); frames=[]
        for sheet in xls.sheet_names:
            tmp=pd.read_excel(p,sheet_name=sheet)
            cols={c.lower().strip():c for c in tmp.columns}
            ren={}
            if "exercise name" in cols: ren[cols["exercise name"]]="name"
            if "exercise_name" in cols: ren[cols["exercise_name"]]="name"
            if "primary muscle" in cols: ren[cols["primary muscle"]]="primary_muscle"
            if "primary_muscle" in cols: ren[cols["primary_muscle"]]="primary_muscle"
            if "category" in cols: ren[cols["category"]]="category"
            if "experience level" in cols: ren[cols["experience level"]]="experience"
            if "experience" in cols: ren[cols["experience"]]="experience"
            if "video url" in cols: ren[cols["video url"]]="video"
            if "video_link" in cols: ren[cols["video_link"]]="video"
            if "equipment" in cols: ren[cols["equipment"]]="equipment"
            tmp=tmp.rename(columns=ren)
            for col in ["name","primary_muscle","category","experience","equipment","video"]:
                if col not in tmp.columns: tmp[col]=np.nan
            frames.append(tmp[["name","primary_muscle","category","experience","equipment","video"]])
        return pd.concat(frames,ignore_index=True)
    def _clean_library(self):
        lib=self.lib.copy()
        for c in ["name","primary_muscle","category","experience","equipment","video"]:
            lib[c]=lib[c].astype(str).str.strip()
        lib["experience"]=lib["experience"].str.title().replace({"Beginners":"Beginner","Intermedaite":"Intermediate","Adv":"Advanced"})
        lib["category"]=lib["category"].str.title()
        lib["primary_muscle"]=lib["primary_muscle"].str.title()
        self.lib=lib
    @staticmethod
    def _has_equipment(row_equipment:str, available_eq:List[str])->bool:
        if not row_equipment or str(row_equipment).strip()=="" or str(row_equipment).lower()=="bodyweight": return True
        if not available_eq: return True
        tokens=[t.strip().lower() for t in str(row_equipment).split(",")]
        have=set([e.strip().lower() for e in available_eq])
        return any(t in have for t in tokens)
    @staticmethod
    def _injury_excluded(name:str, injuries:List[str])->bool:
        if not injuries: return False
        low=name.lower()
        for inj,keys in INJURY_RULES.items():
            if inj in injuries and any(k in low for k in keys): return True
        return False
    @staticmethod
    def _estimate_set_time_seconds(reps:int, tempo:float, rest:float)->float:
        return reps*tempo+rest
    def _score_exercise(self,row:pd.Series,goal:str,experience:str,target_muscles:List[str],available_eq:List[str],injuries:List[str])->float:
        score=0.0
        if row["primary_muscle"] in GOAL_TO_MUSCLE_BUCKETS.get(goal,[]): score+=2.0
        if target_muscles and row["primary_muscle"] in target_muscles: score+=2.5
        user_lvl=EXPERIENCE_ORDER.get(experience,0); ex_lvl=EXPERIENCE_ORDER.get(row["experience"],0)
        score += 1.0 if ex_lvl<=user_lvl else -2.0
        score += 1.0 if self._has_equipment(row.get("equipment",""), available_eq) else -3.0
        if self._injury_excluded(row["name"], injuries): score -= 100.0
        return score
    def _week_overrides(self,goal:str,week:int)->Dict[str,float]:
        base=GOAL_PRESETS[goal]; phase=((week-1)%4)+1
        rest=base["rest_s"]; sets_bonus=0; rep_low=base["rep_low"]; rep_high=base["rep_high"]; rpe="RPE 7–8"
        if goal=="fat_loss":
            if phase==1: rd,sb,rpe=0,0,"RPE 7–8"
            elif phase==2: rd,sb,rpe=-5,0,"RPE 7.5–8"
            elif phase==3: rd,sb,rpe=-10,1,"RPE 8"
            else: rd,sb,rpe=+10,-1,"RPE 6–7"
            rest=clamp(base["rest_s"]+rd,25,120)
        elif goal=="hypertrophy":
            if phase==1: sets_bonus,rpe=0,"RPE 7–8"
            elif phase==2: sets_bonus,rpe=+1,"RPE 7.5–8"
            elif phase==3: sets_bonus,rpe=+1,"RPE 8"; rep_low,rep_high=base["rep_low"]+1,base["rep_high"]+1
            else: sets_bonus,rpe=-1,"RPE 6–7"
        elif goal=="strength":
            rpe="RPE 7" if phase==1 else ("RPE 8" if phase==2 else ("RPE 8.5" if phase==3 else "RPE 6–7"))
            if phase==4: sets_bonus=-1
        else:
            if phase==1: rd,sb,rpe=0,0,"RPE 7"
            elif phase==2: rd,sb,rpe=-5,0,"RPE 7.5"
            elif phase==3: rd,sb,rpe=-10,+1,"RPE 8"
            else: rd,sb,rpe=+5,-1,"RPE 6–7"
            rest=clamp(base["rest_s"]+rd,20,120)
        new_min=max(1, base["sets_min"]+sets_bonus); new_max=max(new_min, base["sets_max"]+sets_bonus)
        return {"rest_s":rest,"sets_min":new_min,"sets_max":new_max,"rep_low":rep_low,"rep_high":rep_high,"rpe_text":rpe,"phase":phase}
    def _choose_cardio_exercise(self)->str:
        df=self.lib.copy()
        by_cat=df[df["category"].str.contains("Cardio|Conditioning",case=False,na=False)]
        if not by_cat.empty: return by_cat.iloc[0]["name"]
        name_kw=["treadmill","row","rowing","erg","bike","cycling","spin","airdyne","elliptical","stair","ski"]
        df2=df[df["name"].str.lower().str.contains("|".join(name_kw),na=False)]
        if not df2.empty: return df2.iloc[0]["name"]
        return "Cardio Machine (steady state)"
    def build_session(self, goal, experience, total_session_minutes, available_equipment=None, target_muscles=None, injuries=None, require_cardio=False, goal_param_overrides=None):
        if available_equipment is None: available_equipment=[]
        if target_muscles is None: target_muscles=[]
        if injuries is None: injuries=[]
        df=self.lib.copy()
        df["score"]=df.apply(lambda r:self._score_exercise(r,goal,experience,target_muscles,available_equipment,injuries),axis=1)
        df=df[df["score"]>0].copy()
        top=(df.sort_values(["primary_muscle","score"],ascending=[True,False]).groupby("primary_muscle").head(3))
        muscles=target_muscles if target_muscles else GOAL_TO_MUSCLE_BUCKETS.get(goal,[])
        selected=[]
        for m in muscles:
            c=top[top["primary_muscle"]==m]
            if not c.empty: selected.append(c.iloc[0])
        if not selected: selected=[r for _,r in df.sort_values("score",ascending=False).head(6).iterrows()]
        sel=pd.DataFrame(selected).reset_index(drop=True)
        p=GOAL_PRESETS[goal].copy()
        if goal_param_overrides: p.update({k:v for k,v in goal_param_overrides.items() if k in p})
        reps=int(round((p["rep_low"]+p["rep_high"])/2)); rest=p["rest_s"]; tempo=p["tempo_s_per_rep"]
        sets_min,sets_max=p["sets_min"],p["sets_max"]
        warm=DEFAULTS["warmup_s"]; cool=DEFAULTS["cooldown_s"]; trans=DEFAULTS["transition_s_per_ex"]
        time_left=int(total_session_minutes*60 - warm - cool)
        if time_left<=0: raise ValueError("Session duration too short for warm-up and cool-down.")
        plan=[]; per_set=reps*tempo+rest
        if require_cardio:
            cardio_s=max(6*60, min(10*60, int(0.25*time_left)))
            ex=self._choose_cardio_exercise()
            block=cardio_s+trans
            plan.append({"Exercise":ex,"Primary muscle":"Full Body","Category":"Conditioning","Experience":experience,"Sets":1,"Reps":"Time","Load prescription":"Steady Z2 (RPE 6–7)","Rest (s)":0,"Est. time (s)":block,"Video":""})
            time_left-=block
        for _,r in sel.iterrows():
            if time_left <= (per_set+trans): break
            n=sets_min; block=n*per_set+trans
            if block>time_left: break
            plan.append({"Exercise":r["name"],"Primary muscle":r["primary_muscle"],"Category":r["category"],"Experience":r["experience"],"Sets":n,"Reps":reps,"Load prescription":"RPE 7–8 (2–3 RIR)" if goal in ["hypertrophy","fat_loss","endurance","core_stability"] else "Start ~80–87% 1RM (RPE 8–9)","Rest (s)":rest,"Est. time (s)":block,"Video":r.get("video","")})
            time_left-=block
        i=0
        while time_left>per_set and any((row.get("Category","")!="Conditioning") and row["Sets"]<sets_max for row in plan):
            if plan[i].get("Category","")!="Conditioning" and plan[i]["Sets"]<sets_max:
                plan[i]["Sets"]+=1; plan[i]["Est. time (s)"]+=per_set; time_left-=per_set
            i=(i+1)%len(plan)
        if time_left>180 and goal in ["fat_loss","endurance","hypertrophy"] and not require_cardio:
            plan.append({"Exercise":"Finisher: EMOM — Burpees or KB Swings","Primary muscle":"Full Body","Category":"Conditioning","Experience":experience,"Sets":int(time_left//60),"Reps":"EMOM 10–15 reps","Load prescription":"Bodyweight/Light KB","Rest (s)":"Balance of minute","Est. time (s)":int(time_left),"Video":""})
            time_left=0
        plan_df=pd.DataFrame(plan)
        if plan_df.empty:
            plan_df=pd.DataFrame([{"Exercise":"Walk (brisk)","Primary muscle":"Full Body","Category":"Conditioning","Experience":experience,"Sets":1,"Reps":"Time","Load prescription":"RPE 6","Rest (s)":0,"Est. time (s)":int(total_session_minutes*60 - warm - cool),"Video":""}])
        plan_df["Est. time (min)"]=(plan_df["Est. time (s)"]/60).round(1)
        total_used=plan_df["Est. time (s)"].sum()+warm+cool
        summary=pd.DataFrame([{"Total session (min)":round(total_used/60,1),"Warm-up (min)":round(warm/60,1),"Cool-down (min)":round(cool/60,1),"Exercises":len(plan_df)}])
        return plan_df, summary
    def _split_targets(self,goal,base_targets,days_per_week):
        if base_targets: return [base_targets for _ in range(days_per_week)]
        all_m=GOAL_TO_MUSCLE_BUCKETS.get(goal,[])
        chunks=[]; n=max(1,len(all_m)//max(1,days_per_week))
        for i in range(days_per_week):
            chunk=all_m[i*n:(i+1)*n] or all_m[-n:]
            chunks.append(chunk)
        return chunks
    def build_program(self, goal, experience, total_session_minutes, available_equipment=None, target_muscles=None, injuries=None, weeks=8, days_per_week=3, require_cardio=False):
        if available_equipment is None: available_equipment=[]
        if target_muscles is None: target_muscles=[]
        if injuries is None: injuries=[]
        day_targets=self._split_targets(goal,target_muscles,days_per_week)
        all_rows=[]; sched=[]
        for w in range(1,weeks+1):
            wov=self._week_overrides(goal,w)
            overrides={"rest_s":wov["rest_s"],"sets_min":wov["sets_min"],"sets_max":wov["sets_max"],"rep_low":wov["rep_low"],"rep_high":wov["rep_high"]}
            for d in range(1,days_per_week+1):
                tm=day_targets[(d-1)%len(day_targets)]
                plan,summary=self.build_session(goal,experience,total_session_minutes,available_equipment,tm,injuries,require_cardio,overrides)
                plan.insert(0,"Week",w); plan.insert(1,"Day",d); plan.insert(2,"Session ID",f"W{w}D{d:02d}")
                plan["RPE target (week)"]=wov["rpe_text"]; plan["Phase (1-3=build,4=deload)"]=wov["phase"]
                all_rows.append(plan)
                s=summary.iloc[0].to_dict(); s.update({"Week":w,"Day":d,"Session ID":f"W{w}D{d:02d}","Targets":", ".join(tm),"RPE target (week)":wov["rpe_text"],"Phase (1-3=build,4=deload)":wov["phase"]})
                sched.append(s)
        return pd.concat(all_rows,ignore_index=True), pd.DataFrame(sched)
    @staticmethod
    def _merge_location_equipment(equip:List[str], location:str)->List[str]:
        base=set([e for e in equip if e])
        if (not base) and location in ("Gym","Home","Outdoors","Mix of locations"):
            base.update(UI_LOCATION_EQUIPMENT_DEFAULTS[location])
        if "yoga_mat" in base:
            base.remove("yoga_mat"); base.update(["bodyweight","stability ball"])
        return sorted(base)
    @staticmethod
    def clean_ui_payload(ui:Dict)->Dict:
        goal=UI_GOAL_MAP.get(str(ui.get("Specific Goals","")).strip(),"hypertrophy")
        exp=UI_EXPERIENCE_MAP.get(str(ui.get("Training Experience","")).strip(),"Beginner")
        loc=str(ui.get("Training Locations","")).strip() or "Gym"
        eq_ui=ui.get("Available Equipments",[]); eq_ui=[eq_ui] if isinstance(eq_ui,str) else eq_ui
        tokens=[]; 
        for item in eq_ui: tokens+=UI_EQUIPMENT_TOKENS.get(str(item).strip(),[])
        available=WorkoutPlanner._merge_location_equipment(tokens,loc)
        focus=ui.get("Specific Areas to Focus on",[]); focus=[focus] if isinstance(focus,str) else focus
        targets=[]; 
        for f in focus: targets+=UI_FOCUS_TO_MUSCLES.get(str(f).strip(),[])
        target_muscles=sorted(set(targets))
        minutes=max(20,min(120,int(ui.get("total_session_minutes",45))))
        injuries=ui.get("injuries",[]); injuries=[injuries] if isinstance(injuries,str) else injuries
        injuries=[i.strip().lower().replace(" ","_") for i in injuries if i]
        require_cardio=("cardio_machine" in available) or ("Cardio fitness" in focus)
        return {"goal":goal,"experience":exp,"total_session_minutes":minutes,"available_equipment":available,"target_muscles":target_muscles,"injuries":injuries,"require_cardio":require_cardio}
    def build_session_from_ui(self,ui:Dict):
        c=self.clean_ui_payload(ui)
        return self.build_session(c["goal"],c["experience"],c["total_session_minutes"],c["available_equipment"],c["target_muscles"],c["injuries"],c["require_cardio"])
    def build_program_from_ui(self,ui:Dict,weeks:int=8,days_per_week:int=3):
        c=self.clean_ui_payload(ui)
        return self.build_program(c["goal"],c["experience"],c["total_session_minutes"],c["available_equipment"],c["target_muscles"],c["injuries"],weeks,days_per_week,c["require_cardio"])
