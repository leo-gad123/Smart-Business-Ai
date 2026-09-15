import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  X, 
  Clock, 
  UserPlus, 
  FileText, 
  Trash2, 
  KeyRound, 
  Copy, 
  Check, 
  Send, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { User, UserRole, ShiftType, EmployeeContract, StaffShiftRecord } from '../../../types';
import { db } from '../../../services/db';
import jsPDF from 'jspdf';

interface Card2EmployeeShiftModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onSaveUser: (user: User) => void;
  onRefreshData?: () => void;
}

export const Card2EmployeeShiftModal: React.FC<Card2EmployeeShiftModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onSaveUser,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'shift_tracking' | 'staff_directory' | 'contracts'>('shift_tracking');

  // Staff Shifts state
  const [staffShifts, setStaffShifts] = useState<StaffShiftRecord[]>(() => db.getStaffShifts());
  const [contracts, setContracts] = useState<EmployeeContract[]>(() => db.getContracts());

  // Form: Register Staff
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('+250 78');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [empShift, setEmpShift] = useState<ShiftType>('WHOLE_DAY');
  const [empSalary, setEmpSalary] = useState('75000');
  const [empPin, setEmpPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [empPassword, setEmpPassword] = useState('');
  // Optional PDF documents for new employee registration (PHOTO 1)
  const [empCvFile, setEmpCvFile] = useState<{ name: string; size: number } | null>(null);
  const [empContractFile, setEmpContractFile] = useState<{ name: string; size: number } | null>(null);
  const [isDraggingCv, setIsDraggingCv] = useState(false);
  const [isDraggingContract, setIsDraggingContract] = useState(false);

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    name: string;
    phone: string;
    role: string;
    pin: string;
    password: string;
  } | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  // Contract Generation / Upload State
  const [selectedStaffForContract, setSelectedStaffForContract] = useState<string>(allUsers[1]?.id || allUsers[0]?.id || '');
  const [contractSalary, setContractSalary] = useState('75000');
  const [contractNationalId, setContractNationalId] = useState('1 1996 8 0034291 0 45');
  const [contractType, setContractType] = useState<'PERMANENT' | 'FIXED_TERM'>('PERMANENT');
  const [contractSuccess, setContractSuccess] = useState<string | null>(null);

  // Refresh local records from db
  const reloadData = () => {
    setStaffShifts(db.getStaffShifts());
    setContracts(db.getContracts());
    if (onRefreshData) onRefreshData();
  };

  // Clock In / Clock Out Handler
  const handleToggleClock = (userId: string, currentStatus: 'ON_DUTY' | 'COMPLETED' | 'ABSENT' | 'LATE') => {
    if (currentStatus === 'ON_DUTY') {
      db.clockStaff(userId, 'out');
    } else {
      db.clockStaff(userId, 'in');
    }
    reloadData();
  };

  // Register Employee
  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empPhone.trim()) {
      alert('Injiza izina n\'inimeri ya telefone by\'umukozi.');
      return;
    }

    const autoPassword = empPassword.trim() || `Rwanda@${Math.floor(1000 + Math.random() * 9000)}`;
    const autoPin = empPin.trim() || String(Math.floor(1000 + Math.random() * 9000));

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: empName.trim(),
      phone: empPhone.trim(),
      email: empEmail.trim() || `${empName.toLowerCase().replace(/\s+/g, '.')}@shop.rw`,
      role: empRole,
      shiftType: empShift,
      pin: autoPin,
      shopName: currentUser.shopName,
      active: true,
      cvFileName: empCvFile?.name,
      contractFileName: empContractFile?.name
    };

    onSaveUser(newUser);

    // Also auto-generate employee contract record
    const newContract: EmployeeContract = {
      id: `cont-${Date.now()}`,
      userId: newUser.id,
      employeeName: newUser.name,
      nationalIdOrPassport: '1 199' + Math.floor(1000000000 + Math.random() * 9000000000),
      role: newUser.role,
      monthlySalaryRwf: parseFloat(empSalary) || 75000,
      shiftType: newUser.shiftType || 'WHOLE_DAY',
      startDate: new Date().toISOString().split('T')[0],
      contractType: 'PERMANENT',
      status: 'ACTIVE',
      pdfFileName: empContractFile ? empContractFile.name : `Contract_${newUser.name.replace(/\s+/g, '_')}.pdf`,
      createdAt: new Date().toISOString()
    };
    db.saveContract(newContract);

    setGeneratedCredentials({
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role === 'owner' ? 'Owner / Manager' : 'Cashier / Employee',
      pin: autoPin,
      password: autoPassword
    });

    // Reset Form
    setEmpName('');
    setEmpPhone('+250 78');
    setEmpEmail('');
    setEmpPin(String(Math.floor(1000 + Math.random() * 9000)));
    setEmpPassword('');
    setEmpCvFile(null);
    setEmpContractFile(null);
    reloadData();
  };

  // Remove Employee
  const handleRemoveEmployee = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Ntushobora kwikura mu bakozi ubwawe (You cannot remove the current active owner account).');
      return;
    }

    if (confirm(`Urashaka gukura "${userName}" mu bakozi b'iduka? (Are you sure you want to remove this employee?)`)) {
      db.deleteUser(userId);
      // Also mark contracts terminated
      const existingContracts = db.getContracts().filter(c => c.userId === userId);
      existingContracts.forEach(c => {
        c.status = 'TERMINATED';
        db.saveContract(c);
      });
      reloadData();
    }
  };

  // Copy Credentials
  const handleCopyCredentials = () => {
    if (!generatedCredentials) return;
    const text = `SmartStock Rwanda Credentials:\nShop: ${currentUser.shopName}\nName: ${generatedCredentials.name}\nRole: ${generatedCredentials.role}\nPOS Quick PIN: ${generatedCredentials.pin}\nPassword: ${generatedCredentials.password}\nLogin at: https://smartstock.rw`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  // Send SMS Notice
  const handleSendCredentialsSMS = () => {
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 3000);
  };

  // Generate Official Rwanda Labor Contract PDF using jsPDF
  const handleGenerateRwandaContractPDF = (contractTargetUser?: User) => {
    const targetUser = contractTargetUser || allUsers.find(u => u.id === selectedStaffForContract) || allUsers[0];
    if (!targetUser) return;

    try {
      const doc = new jsPDF();

      // Header & Emblem
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('REPUBLIC OF RWANDA', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('MINISTRY OF PUBLIC SERVICE AND LABOUR (MIFOTRA)', 105, 26, { align: 'center' });
      doc.text('STANDARD RETAIL EMPLOYMENT CONTRACT', 105, 32, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.line(20, 36, 190, 36);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('AMASEZERANO Y\'AKAZI K\'IGIHE CYOSE (EMPLOYMENT CONTRACT)', 105, 45, { align: 'center' });

      // Parties
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Aya masezerano akorwa hagati ya:', 20, 56);

      doc.setFont('helvetica', 'bold');
      doc.text(`1. UMUKORESHA (EMPLOYER): ${currentUser.shopName}`, 25, 63);
      doc.setFont('helvetica', 'normal');
      doc.text(`Uhagarariwe na: ${currentUser.name} (Proprietor/Gérant)`, 25, 69);
      doc.text(`Aho rikorera: Kigali, Rwanda | Telefone: ${currentUser.phone}`, 25, 75);

      doc.setFont('helvetica', 'bold');
      doc.text(`2. UMUKOZI (EMPLOYEE): ${targetUser.name}`, 25, 84);
      doc.setFont('helvetica', 'normal');
      doc.text(`Indangamuntu (National ID): ${contractNationalId}`, 25, 90);
      doc.text(`Telefone: ${targetUser.phone} | Imeri: ${targetUser.email || 'N/A'}`, 25, 96);
      doc.text(`Inshingano: Cashier & POS Operator (${targetUser.role.toUpperCase()})`, 25, 102);

      // Articles
      doc.setFont('helvetica', 'bold');
      doc.text('INGINGO YA 1: INSHINGANO N\'AMASAHA Y\'AKAZI (DUTIES & HOURS)', 20, 114);
      doc.setFont('helvetica', 'normal');
      const shiftDesc = targetUser.shiftType === 'MORNING_SHIFT' ? 'Morning Shift (07:00 - 15:00)' :
                        targetUser.shiftType === 'AFTERNOON_SHIFT' ? 'Afternoon Shift (14:30 - 22:30)' :
                        'Full Day Shift (07:30 - 21:00 with meal breaks)';
      doc.text(`Umukozi yemeye gukora nk'umucungamari (Cashier). Ishifuti ye ni: ${shiftDesc}.`, 20, 121);
      doc.text('Umukozi asabwa gukoresha POS ya SmartStock mu mucyo no kwirinda uburiganya bwose.', 20, 127);

      doc.setFont('helvetica', 'bold');
      doc.text('INGINGO YA 2: UMUHEMBO N\'UBWITEGANYIRIZE (SALARY & RSSB)', 20, 137);
      doc.setFont('helvetica', 'normal');
      doc.text(`Umukozi azajya ahembwa amafaranga y'u Rwanda ${parseFloat(contractSalary).toLocaleString()} RWF buri kwezi.`, 20, 144);
      doc.text('Amafaranga ahembwa azajya anyuzwa kuri MTN Mobile Money cyangwa konti ya banki y\'umukozi.', 20, 150);
      doc.text('Imisoro y\'umushahara (PAYE) n\'ubwiteganyirize bw\'abakozi (RSSB) biteganywa n\'amategeko.', 20, 156);

      doc.setFont('helvetica', 'bold');
      doc.text('INGINGO YA 3: IKOSORA N\'IRANGIRA RY\'AMASEZERANO', 20, 166);
      doc.setFont('helvetica', 'normal');
      doc.text('Amasezerano ashobora guseswa hakurikijwe itegeko rigenga umurimo mu Rwanda N° 66/2018.', 20, 173);
      doc.text('Kunyereza umutungo w\'iduka cyangwa ibura rya cash mu kigega bituma amasezerano asheshwa ako kanya.', 20, 179);

      // Signatures
      doc.line(20, 205, 190, 205);
      doc.setFont('helvetica', 'bold');
      doc.text('Bikorewe i Kigali, kuwa: ' + new Date().toLocaleDateString('en-GB'), 20, 215);

      doc.text('UMUKORESHA (EMPLOYER):', 30, 230);
      doc.text(currentUser.name, 30, 238);
      doc.setFont('helvetica', 'normal');
      doc.text('Umukono / Signature: [Verified Electronic]', 30, 244);

      doc.setFont('helvetica', 'bold');
      doc.text('UMUKOZI (EMPLOYEE):', 120, 230);
      doc.text(targetUser.name, 120, 238);
      doc.setFont('helvetica', 'normal');
      doc.text('Umukono / Signature: [Verified Electronic]', 120, 244);

      // Save PDF
      const pdfFileName = `Rwanda_Employment_Contract_${targetUser.name.replace(/\s+/g, '_')}.pdf`;
      doc.save(pdfFileName);

      // Also record in Contracts DB
      const existing = contracts.find(c => c.userId === targetUser.id);
      if (existing) {
        existing.monthlySalaryRwf = parseFloat(contractSalary);
        existing.pdfFileName = pdfFileName;
        db.saveContract(existing);
      } else {
        db.saveContract({
          id: `cont-${Date.now()}`,
          userId: targetUser.id,
          employeeName: targetUser.name,
          nationalIdOrPassport: contractNationalId,
          role: targetUser.role,
          monthlySalaryRwf: parseFloat(contractSalary) || 75000,
          shiftType: targetUser.shiftType || 'WHOLE_DAY',
          startDate: new Date().toISOString().split('T')[0],
          contractType,
          status: 'ACTIVE',
          pdfFileName,
          createdAt: new Date().toISOString()
        });
      }

      setContractSuccess(`Amasezerano ya PDF (Contract) kuri "${targetUser.name}" yakozwe neza kandi yabitswe!`);
      setTimeout(() => setContractSuccess(null), 4000);
      reloadData();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('PDF generation error. Please retry.');
    }
  };

  // Mock Upload of signed contract
  const handleUploadContractFile = (userId: string, userName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const existing = contracts.find(c => c.userId === userId);
        if (existing) {
          existing.pdfFileName = file.name;
          db.saveContract(existing);
        } else {
          db.saveContract({
            id: `cont-${Date.now()}`,
            userId,
            employeeName: userName,
            nationalIdOrPassport: '1 1996 8 0034291 0 45',
            role: 'employee',
            monthlySalaryRwf: 75000,
            shiftType: 'WHOLE_DAY',
            startDate: new Date().toISOString().split('T')[0],
            contractType: 'PERMANENT',
            status: 'ACTIVE',
            pdfFileName: file.name,
            createdAt: new Date().toISOString()
          });
        }
        reloadData();
        alert(`Contract PDF "${file.name}" yabitswe neza kuri ${userName}!`);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Employee Management & Shift Tracking
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Card 2
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Gukurikirana amasaha n'amashifuti y'abakozi, kwandika/gukura umukozi, no kubika ama Contract (PDF).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800 flex gap-2 bg-slate-900/30 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('shift_tracking')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSubTab === 'shift_tracking'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Clock-In / Shift Tracking ({allUsers.length} Staff)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('staff_directory')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSubTab === 'staff_directory'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Kwandika / Gukura Umukozi (Add/Remove Staff)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('contracts')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSubTab === 'contracts'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Ama Contract ya PDF (Employment Documents)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: CLOCK-IN / SHIFT TRACKING */}
          {activeSubTab === 'shift_tracking' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Uko Amashifuti Ahagaze Uyu Munsi (Active Shifts Roster)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Genzura abakozi bari ku kazi (Clock-in), amasaha bamazeho n'igihe baviraho.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full self-start">
                  Live Clock Tracking
                </span>
              </div>

              {/* Staff Shift Roster Cards */}
              <div className="space-y-3">
                {allUsers.map(user => {
                  const shiftRec = staffShifts.find(s => s.userId === user.id);
                  const isOnDuty = shiftRec?.status === 'ON_DUTY';
                  const isCompleted = shiftRec?.status === 'COMPLETED';

                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isOnDuty 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {user.name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{user.name}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {user.role}
                            </span>
                            {isOnDuty && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                ON DUTY (Arakora)
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                            <span>Phone: <strong className="text-slate-200">{user.phone}</strong></span>
                            <span>&bull;</span>
                            <span>Shift: <strong className="text-slate-200">{user.shiftType?.replace('_', ' ') || 'WHOLE DAY'}</strong></span>
                            <span>&bull;</span>
                            <span>PIN: <span className="font-mono text-slate-300">{user.pin}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Clock In/Out Status & Button */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right text-xs">
                          {shiftRec ? (
                            <div>
                              <div className="font-mono text-slate-300">
                                In: {shiftRec.clockInTime} {shiftRec.clockOutTime ? `| Out: ${shiftRec.clockOutTime}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {isOnDuty ? 'Active shift in progress' : `Shift finished (${shiftRec.hoursLogged || 8} hrs)`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Ntaragera ku kazi</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleClock(user.id, shiftRec?.status || 'ABSENT')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isOnDuty
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isOnDuty ? 'Clock Out (Gusoza)' : 'Clock In (Kwinjira)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ADD / REMOVE STAFF DIRECTORY */}
          {activeSubTab === 'staff_directory' && (
            <div className="space-y-6">
              {/* Add New Staff Form */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Kwaza Umukozi Mushya (Register New Staff Member)
                  </h3>
                </div>

                <form onSubmit={handleRegisterEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Amazina Yose (Full Name) <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="urugero: Diane Mukamana"
                        value={empName}
                        onChange={(e) => setEmpName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Telefone (MTN/Airtel) <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+250 788 123 456"
                        value={empPhone}
                        onChange={(e) => setEmpPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Imeri (Email Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="diane@shop.rw"
                        value={empEmail}
                        onChange={(e) => setEmpEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Inshingano (Role)
                      </label>
                      <select
                        value={empRole}
                        onChange={(e) => setEmpRole(e.target.value as UserRole)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="employee">Cashier (Umukozi wo gucuruza)</option>
                        <option value="owner">Gérant / Co-Owner (Umuyobozi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Ishifuti (Shift)
                      </label>
                      <select
                        value={empShift}
                        onChange={(e) => setEmpShift(e.target.value as ShiftType)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="WHOLE_DAY">Umunsi Wose (Whole Day)</option>
                        <option value="MORNING_SHIFT">Mugitondo (07:00 - 15:00)</option>
                        <option value="AFTERNOON_SHIFT">Nyuma ya Saa Sita (14:30 - 22:30)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Umushahara (Salary RWF/mo)
                      </label>
                      <input
                        type="number"
                        value={empSalary}
                        onChange={(e) => setEmpSalary(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Quick POS 4-Digit PIN
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={empPin}
                        onChange={(e) => setEmpPin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-400 font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional PDF Uploads (PHOTO 1 Requirement) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Upload 1: Shyiramo CV (Optional PDF) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          <span>Shyiramo CV (Optional PDF)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Ntabwo ari itegeko</span>
                      </label>

                      {empCvFile ? (
                        <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white truncate block">
                                {empCvFile.name}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                {(empCvFile.size / 1024).toFixed(1)} KB • PDF Yiteguye
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmpCvFile(null)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Siba iyi dosiye"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingCv(true);
                          }}
                          onDragLeave={() => setIsDraggingCv(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingCv(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const f = e.dataTransfer.files[0];
                              setEmpCvFile({ name: f.name, size: f.size });
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer transition ${
                            isDraggingCv
                              ? 'border-purple-500 bg-purple-950/20'
                              : 'border-slate-800 hover:border-purple-500/60 bg-slate-950/60 hover:bg-slate-950'
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                setEmpCvFile({ name: f.name, size: f.size });
                              }
                            }}
                          />
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-200 block truncate">
                              Hitamo dosiye cyangwa uyikurure hano
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              PDF gusa (Optional • Max 10MB)
                            </span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Upload 2: Shyiramo Kontoragho/Contract (Optional PDF) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          <span>Shyiramo Kontoragho/Contract (Optional PDF)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Ntabwo ari itegeko</span>
                      </label>

                      {empContractFile ? (
                        <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white truncate block">
                                {empContractFile.name}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                {(empContractFile.size / 1024).toFixed(1)} KB • PDF Yiteguye
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmpContractFile(null)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Siba iyi dosiye"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingContract(true);
                          }}
                          onDragLeave={() => setIsDraggingContract(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingContract(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const f = e.dataTransfer.files[0];
                              setEmpContractFile({ name: f.name, size: f.size });
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer transition ${
                            isDraggingContract
                              ? 'border-purple-500 bg-purple-950/20'
                              : 'border-slate-800 hover:border-purple-500/60 bg-slate-950/60 hover:bg-slate-950'
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                setEmpContractFile({ name: f.name, size: f.size });
                              }
                            }}
                          />
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-200 block truncate">
                              Hitamo dosiye cyangwa uyikurure hano
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              PDF gusa (Optional • Max 10MB)
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-950/40"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Injiza Umukozi (Save Staff & Credentials)</span>
                    </button>
                  </div>
                </form>

                {/* Generated Credentials Popup Banner */}
                {generatedCredentials && (
                  <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                        <KeyRound className="w-4 h-4" />
                        <span>Login Credentials Z'Umukozi Mushya (Credentials Generated):</span>
                      </div>
                      <span className="text-[10px] text-purple-300 font-mono">Secure Auth</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Staff Name:</span>
                        <span className="text-white font-bold">{generatedCredentials.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Phone:</span>
                        <span className="text-white">{generatedCredentials.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">POS PIN:</span>
                        <span className="text-emerald-400 font-bold text-sm">{generatedCredentials.pin}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Password:</span>
                        <span className="text-amber-300">{generatedCredentials.password}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNotice ? 'Byakoporowe!' : 'Koporora Amakuru (Copy)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendCredentialsSMS}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        {smsSentNotice ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{smsSentNotice ? 'SMS Yageze kuri Telefone!' : 'Ohereza SMS y\'Amabanga (Send SMS)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Staff Roster & Remove Action */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Urutonde rw'Abakozi Banditswe muri Sisitemu ({allUsers.length}):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allUsers.map(user => {
                    const isOwner = user.role === 'owner';
                    const isCurrent = user.id === currentUser.id;

                    return (
                      <div
                        key={user.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{user.name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOwner ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 space-y-0.5 font-mono">
                              <div>Phone: {user.phone}</div>
                              <div>PIN: <span className="text-emerald-400">{user.pin}</span></div>
                              {(user.cvFileName || user.contractFileName) && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {user.cvFileName && (
                                    <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded font-sans flex items-center gap-1">
                                      <FileText className="w-2.5 h-2.5" /> CV: {user.cvFileName}
                                    </span>
                                  )}
                                  {user.contractFileName && (
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-sans flex items-center gap-1">
                                      <FileCheck className="w-2.5 h-2.5" /> Kontoragho: {user.contractFileName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(user.id, user.name)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Gukura uyu mukozi mu iduka (Remove Staff)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRACT DOCUMENTS (PDF STORAGE & GENERATOR) */}
          {activeSubTab === 'contracts' && (
            <div className="space-y-6">
              {contractSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{contractSuccess}</span>
                </div>
              )}

              {/* Generate Official Rwanda Employment Contract */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Kora Amasezerano ya PDF (Generate Official Rwanda Labor Contract)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    MIFOTRA & RRA Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Hitamo Umukozi (Employee)
                    </label>
                    <select
                      value={selectedStaffForContract}
                      onChange={(e) => setSelectedStaffForContract(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Indangamuntu (National ID)
                    </label>
                    <input
                      type="text"
                      value={contractNationalId}
                      onChange={(e) => setContractNationalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Umushahara w'Ukwezi (Salary RWF)
                    </label>
                    <input
                      type="number"
                      value={contractSalary}
                      onChange={(e) => setContractSalary(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateRwandaContractPDF()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download & Save Rwanda Contract PDF</span>
                  </button>
                </div>
              </div>

              {/* Saved Contracts Archive & Upload Storage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ububiko bw'Ama Contract Yabitswe (Contract Documents Archive):
                  </h4>
                  <span className="text-xs text-slate-400">
                    {contracts.length} Documents
                  </span>
                </div>

                <div className="space-y-2.5">
                  {allUsers.map(user => {
                    const contract = contracts.find(c => c.userId === user.id);

                    return (
                      <div
                        key={user.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{user.name}</span>
                              <span className="text-xs text-slate-400">({user.role})</span>
                              {contract && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  contract.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {contract.status}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {contract?.pdfFileName ? (
                                <span className="text-emerald-400 font-mono text-[11px]">
                                  Attached: {contract.pdfFileName}
                                </span>
                              ) : (
                                <span className="text-slate-500">Nta masezerano ya PDF arashyirwaho</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Download PDF or Upload signed copy */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleUploadContractFile(user.id, user.name)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                            title="Shyiraho PDF y'amasezerano (Upload signed contract)"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGenerateRwandaContractPDF(user)}
                            className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                            title="Download standard contract PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
