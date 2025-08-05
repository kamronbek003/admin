import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiRequest } from '../../utils/api';
import ErrorMessage from '../Essential/ErrorMessage';
import LoadingSpinner from '../Essential/LoadingSpinner';
import { DollarSign, Calendar, CreditCard, Search, Check, AlertCircle, UserCheck, UserX, Users, MessageSquare, ChevronDown, Receipt, CalendarDays } from 'lucide-react';

const PaymentType = {
  NAQD: 'NAQD',
  KARTA: 'KARTA',
  BANK: 'BANK',
};

const ExistMonths = {
  YANVAR: 'Yanvar',
  FEVRAL: 'Fevral',
  MART: 'Mart',
  APREL: 'Aprel',
  MAY: 'May',
  IYUN: 'Iyun',
  IYUL: 'Iyul',
  AVGUST: 'Avgust',
  SENTABR: 'Sentabr',
  OKTABR: 'Oktabr',
  NOYABR: 'Noyabr',
  DEKABR: 'Dekabr',
};

const formatDateToYYYYMMDD = (dateInput) => {
  if (!dateInput) return '';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(dateObj.getTime()) || dateObj.getUTCFullYear() !== year || dateObj.getUTCMonth() + 1 !== month || dateObj.getUTCDate() !== day) {
        return '';
      }
      return dateInput;
    }
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '';
    }
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date to YYYY-MM-DD:', e);
    return '';
  }
};

const formatYYYYMMDDToDDMMYYYY = (yyyymmdd) => {
  if (!yyyymmdd || typeof yyyymmdd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) {
    return '';
  }
  try {
    const [year, month, day] = yyyymmdd.split('-');
    const dateObj = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
    if (isNaN(dateObj.getTime()) || dateObj.getUTCFullYear() !== parseInt(year, 10) || dateObj.getUTCMonth() + 1 !== parseInt(month, 10) || dateObj.getUTCDate() !== parseInt(day, 10)) {
        return '';
    }
    return `${day}-${month}-${year}`;
  } catch (e) {
    console.error('Error converting YYYY-MM-DD to DD-MM-YYYY:', e);
    return '';
  }
};

const getAvailableYears = () => {
  const currentYear = new Date().getUTCFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
};

const PaymentForm = ({ token, initialData, students, studentsLoading, studentsError, groups, onFormSubmit, onCancel, showToast }) => {
  const defaultFormState = {
    summa: '',
    date: formatDateToYYYYMMDD(new Date()),
    paymentType: PaymentType.NAQD,
    whichMonth: '',
    whichYear: String(new Date().getUTCFullYear()),
    groupId: '',
    isCompleted: false,
    whyCompleted: '',
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [foundStudentPrimaryId, setFoundStudentPrimaryId] = useState(null);
  const [studentSearchMessage, setStudentSearchMessage] = useState({ text: '', type: 'info' });
  const [groupSearchMessage, setGroupSearchMessage] = useState({ text: '', type: 'info' });
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const groupDropdownRef = useRef(null);
  const isEditing = useMemo(() => !!initialData?.id, [initialData]);

  const normalizedStudents = useMemo(() => {
    if (!students) return [];
    if (Array.isArray(students)) return students;
    if (students.data && Array.isArray(students.data)) return students.data;
    if (students.data && students.data.data && Array.isArray(students.data.data)) return students.data.data;
    return [];
  }, [students]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        summa: initialData.summa !== undefined ? String(initialData.summa) : '',
        date: initialData.date ? formatDateToYYYYMMDD(initialData.date) : formatDateToYYYYMMDD(new Date()),
        paymentType: initialData.paymentType || PaymentType.NAQD,
        whichMonth: initialData.whichMonth || '',
        whichYear: initialData.whichYear ? String(initialData.whichYear) : String(new Date().getUTCFullYear()),
        groupId: initialData.groupId || '',
        isCompleted: initialData.isCompleted || false,
        whyCompleted: initialData.whyCompleted || '',
      });

      if (initialData.studentId && normalizedStudents.length > 0) {
        setFoundStudentPrimaryId(initialData.studentId);
        const initialStudent = normalizedStudents.find(s => s.id === initialData.studentId);
        if (initialStudent) {
          setStudentSearchTerm(initialStudent.studentId || '');
          setStudentSearchMessage({
            text: `✅ Topildi: ${initialStudent.firstName} ${initialStudent.lastName} (${initialStudent.studentId})`,
            type: 'success',
          });
        } else if (initialData.student) {
          setStudentSearchTerm(initialData.student.studentId || '');
          setStudentSearchMessage({
            text: `✅ Talaba: ${initialData.student.firstName} ${initialData.student.lastName} (${initialData.student.studentId}) (Tahrirlanmoqda)`,
            type: 'success',
          });
        }
      }

      if (initialData.groupId && groups) {
        const initialGroup = groups.find(g => g.id === initialData.groupId);
        if (initialGroup) {
          setGroupSearchMessage({
            text: `✅ Guruh: ${initialGroup.name || initialGroup.groupId} tanlandi`,
            type: 'success',
          });
        }
      }
    } else {
      setFormData(defaultFormState);
      setStudentSearchTerm('');
      setFoundStudentPrimaryId(null);
      setStudentSearchMessage({ text: '', type: 'info' });
      setGroupSearchMessage({ text: '', type: 'info' });
    }
  }, [isEditing, initialData, normalizedStudents, groups]);

  const availableGroups = useMemo(() => {
    if (!foundStudentPrimaryId || !normalizedStudents || !groups) {
      return [];
    }
    const selectedStudent = normalizedStudents.find(s => s.id === foundStudentPrimaryId);
    if (!selectedStudent || !selectedStudent.groups || !Array.isArray(selectedStudent.groups)) {
      return [];
    }
    return groups.filter(g => selectedStudent.groups.some(sg => String(sg.id) === String(g.id)));
  }, [foundStudentPrimaryId, normalizedStudents, groups]);

  const paymentDetails = useMemo(() => {
    if (!formData.groupId || !groups || !foundStudentPrimaryId || !normalizedStudents) {
      return { originalPrice: 0, discountAmount: 0, finalPrice: 0 };
    }
    const group = groups.find(g => g.id === formData.groupId);
    const student = normalizedStudents.find(s => s.id === foundStudentPrimaryId);
    const originalPrice = parseFloat(group?.coursePrice || 0);
    const discountPercent = parseInt(student?.discount || 0) || 0;
    const discountAmount = originalPrice * (discountPercent / 100);
    const finalPrice = originalPrice - discountAmount;
    return {
      originalPrice: Math.round(originalPrice),
      discountAmount: Math.round(discountAmount),
      finalPrice: Math.round(finalPrice),
    };
  }, [formData.groupId, groups, foundStudentPrimaryId, normalizedStudents]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleStudentSearchChange = useCallback((e) => {
    const searchTerm = e.target.value;
    setStudentSearchTerm(searchTerm);
    setFoundStudentPrimaryId(null);
    setStudentSearchMessage({ text: '', type: 'info' });
    setFormData(prev => ({ ...prev, groupId: '' }));
    setGroupSearchMessage({ text: '', type: 'info' });
    if (studentsLoading || studentsError || !normalizedStudents || normalizedStudents.length === 0) {
      return;
    }
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      const found = normalizedStudents.find(student => student.studentId?.trim().toLowerCase() === trimmedSearchTerm.toLowerCase());
      if (found) {
        setFoundStudentPrimaryId(found.id);
        setStudentSearchMessage({ text: `✅ Topildi: ${found.firstName} ${found.lastName} (${found.studentId})`, type: 'success' });
      } else {
        setStudentSearchMessage({ text: `❌ Student ID "${trimmedSearchTerm}" topilmadi.`, type: 'error' });
      }
    }
  }, [studentsLoading, studentsError, normalizedStudents]);

  const handleGroupSelect = useCallback((groupId) => {
    setFormData(prev => ({ ...prev, groupId }));
    const group = availableGroups.find(g => g.id === groupId);
    setGroupSearchMessage({ text: group ? `✅ Guruh: ${group.name || group.groupId} tanlandi` : '', type: 'success' });
    setIsGroupDropdownOpen(false);
  }, [availableGroups]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    if (!foundStudentPrimaryId || !formData.groupId || !formData.date) {
      const msg = "Iltimos, talaba, guruh va to'lov sanasini to'g'ri tanlang.";
      setError(msg);
      showToast?.(msg, 'error');
      return;
    }

    if (formData.isCompleted && !formData.whyCompleted?.trim()) {
        const msg = "To'lovni yakunlangan deb belgilasangiz, 'Yakunlash Sababi' maydonini to'ldirish shart.";
        setError(msg);
        showToast?.(msg, 'error');
        return;
    }

    setLoading(true);

    const summaValue = parseFloat(formData.summa);
    const dateToSend = formatYYYYMMDDToDDMMYYYY(formData.date);
    
    const payload = {
      studentId: foundStudentPrimaryId,
      groupId: formData.groupId,
      summa: summaValue,
      date: dateToSend,
      paymentType: formData.paymentType,
      whichMonth: formData.whichMonth || undefined,
      whichYear: formData.whichYear ? parseInt(formData.whichYear, 10) : undefined,
      isCompleted: formData.isCompleted,
      whyCompleted: formData.isCompleted ? formData.whyCompleted : undefined,
    };

    try {
      const endpoint = isEditing ? `/payments/${initialData.id}` : '/payments';
      const method = isEditing ? 'PATCH' : 'POST';
      const result = await apiRequest(endpoint, method, payload, token);
      
      onFormSubmit(result);
      showToast?.(isEditing ? "To'lov muvaffaqiyatli yangilandi!" : "To'lov muvaffaqiyatli qo'shildi!", 'success');
    } catch (err) {
      const serverErrorMessage = err.originalError?.response?.data?.message || err.message;
      const finalErrorMessage = Array.isArray(serverErrorMessage) ? serverErrorMessage.join('; ') : serverErrorMessage;
      setError(finalErrorMessage || (isEditing ? "To'lovni yangilab bo'lmadi." : "To'lov qo'shib bo'lmadi."));
      showToast?.(finalErrorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, isEditing, initialData, token, onFormSubmit, foundStudentPrimaryId, showToast]);

  const inputBaseClass = 'block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 bg-white';
  const labelBaseClass = 'block text-sm font-semibold text-gray-700 mb-2 flex items-center';
  const disabledInputClass = 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200';
  const dropdownButtonClass = 'w-full flex items-center justify-between text-left px-4 py-3 border rounded-xl shadow-sm focus:outline-none text-sm transition-all duration-200';
  const availableMonths = Object.entries(ExistMonths);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8 bg-gray-50 shadow-2xl rounded-2xl max-w-2xl mx-auto">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} type="error" />}
      {loading && (
        <div className="my-4 flex items-center justify-center">
          <LoadingSpinner size="small" color="indigo-600" />
          <p className="ml-2 text-sm text-indigo-600">Jo'natilmoqda...</p>
        </div>
      )}
      {studentsError && <ErrorMessage message={`Talabalar ro'yxatini yuklashda xatolik: ${studentsError}`} type="warning" />}

      <div className="space-y-8">
        <div className="p-5 bg-white rounded-xl shadow-md transition-shadow hover:shadow-lg">
          <label htmlFor="studentSearch" className={labelBaseClass}>
            <Search size={18} className="mr-2 text-indigo-500" />
            Talaba ID *
          </label>
          <div className="relative">
            <input
              type="text"
              id="studentSearch"
              name="studentSearch"
              value={studentSearchTerm}
              onChange={handleStudentSearchChange}
              placeholder="Talabaning ID raqamini kiriting..."
              disabled={studentsLoading || !!studentsError || isEditing}
              className={`${inputBaseClass} ${studentsLoading || !!studentsError || isEditing ? disabledInputClass : ''}`}
              required={!isEditing}
              autoComplete="off"
            />
            {studentSearchTerm && !studentsLoading && !studentsError && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                {foundStudentPrimaryId ? <Check size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
              </div>
            )}
          </div>
          <div className="mt-2 min-h-[1.25rem]">
            {studentSearchMessage.text && (
                <p className={`text-xs flex items-center ${studentSearchMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {studentSearchMessage.type === 'success' ? <UserCheck size={14} className="mr-1" /> : <UserX size={14} className="mr-1" />}
                    {studentSearchMessage.text}
                </p>
            )}
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-md transition-shadow hover:shadow-lg" ref={groupDropdownRef}>
            <label htmlFor="groupSelect" className={labelBaseClass}>
                <Users size={18} className="mr-2 text-indigo-500" />
                Guruh *
            </label>
            <button
                type="button"
                id="groupSelect"
                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                disabled={!foundStudentPrimaryId || availableGroups.length === 0 || loading}
                className={`${dropdownButtonClass} ${isGroupDropdownOpen ? 'ring-2 ring-indigo-500' : ''} ${!foundStudentPrimaryId || availableGroups.length === 0 || loading ? disabledInputClass : 'bg-white hover:border-gray-400'}`}
            >
                <span className="truncate text-sm">
                    {formData.groupId ? <span className="font-semibold text-green-700">{availableGroups.find(g => g.id === formData.groupId)?.name || `Guruh tanlandi`}</span> : availableGroups.length === 0 ? 'Guruhlar topilmadi' : 'Guruh tanlang...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isGroupDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isGroupDropdownOpen && availableGroups.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-white shadow-2xl border border-gray-200 rounded-xl max-h-64 overflow-y-auto p-2">
                    {availableGroups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => handleGroupSelect(group.id)}
                            className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer rounded-lg flex items-center justify-between ${formData.groupId === group.id ? 'bg-indigo-100' : ''}`}
                            role="option"
                            aria-selected={formData.groupId === group.id}
                        >
                            <span className={`flex-1 text-sm ${formData.groupId === group.id ? 'font-semibold text-indigo-700' : 'text-gray-800'}`}>
                                {group.name || group.groupId}
                                {group.coursePrice && <span className="text-xs text-gray-500 ml-2">({group.coursePrice.toLocaleString('uz-UZ')} so'm)</span>}
                            </span>
                            {formData.groupId === group.id && <Check size={18} className="text-indigo-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {formData.groupId && paymentDetails.originalPrice > 0 && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <h3 className="text-md font-semibold text-indigo-800 mb-3 flex items-center"><Receipt size={18} className="mr-2" />To'lov Xulosasi</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-gray-600">
                        <p>Asl narx:</p>
                        <p className="font-medium text-gray-800">{paymentDetails.originalPrice.toLocaleString('uz-UZ')} so'm</p>
                    </div>
                    {paymentDetails.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-gray-600">
                            <p>Chegirma ({normalizedStudents.find(s => s.id === foundStudentPrimaryId)?.discount || 0}%):</p>
                            <p className="font-medium text-red-600">-{paymentDetails.discountAmount.toLocaleString('uz-UZ')} so'm</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-indigo-200 text-indigo-800">
                        <p className="font-semibold">Yakuniy narx:</p>
                        <p className="font-bold text-lg text-green-600">{paymentDetails.finalPrice.toLocaleString('uz-UZ')} so'm</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="summa" className={labelBaseClass}><DollarSign size={18} className="mr-2 text-indigo-500" />To'lov summasi *</label>
                <input type="number" name="summa" id="summa" value={formData.summa} onChange={handleChange} required min="1" placeholder="0" className={`${inputBaseClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-lg font-semibold`} />
            </div>
            <div>
                <label htmlFor="date" className={labelBaseClass}><Calendar size={18} className="mr-2 text-indigo-500" />To'lov sanasi *</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className={inputBaseClass} />
            </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-md transition-shadow hover:shadow-lg">
            <div>
                <label htmlFor="paymentType" className={labelBaseClass}><CreditCard size={18} className="mr-2 text-indigo-500" />To'lov usuli *</label>
                <select name="paymentType" id="paymentType" value={formData.paymentType} onChange={handleChange} required className={inputBaseClass}>
                    {Object.entries(PaymentType).map(([key, value]) => (<option key={value} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>))}
                </select>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-5">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isCompleted" 
                  name="isCompleted" 
                  checked={formData.isCompleted || false} 
                  onChange={handleChange} 
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" 
                />
                <label htmlFor="isCompleted" className="ml-3 text-sm font-medium text-gray-800 cursor-pointer">
                  To'lovni yakunlangan deb belgilash
                </label>
              </div>
              {formData.isCompleted && (
                <div className="mt-4 animate-fade-in">
                  <label htmlFor="whyCompleted" className={labelBaseClass}>
                    <MessageSquare size={18} className="mr-2 text-indigo-500" />
                    Yakunlash Sababi *
                  </label>
                  <textarea 
                    id="whyCompleted" 
                    name="whyCompleted" 
                    value={formData.whyCompleted || ""} 
                    onChange={handleChange} 
                    required={formData.isCompleted} 
                    className={inputBaseClass} 
                    rows="2" 
                    placeholder="Masalan: O'quvchi bilan kelishilgan holda..." 
                  />
                </div>
              )}
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="whichMonth" className={labelBaseClass}><CalendarDays size={18} className="mr-2 text-indigo-500" />Qaysi oy uchun</label>
                <select name="whichMonth" id="whichMonth" value={formData.whichMonth} onChange={handleChange} className={inputBaseClass}>
                    <option value="">Oy tanlanmagan</option>
                    {availableMonths.map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="whichYear" className={labelBaseClass}><CalendarDays size={18} className="mr-2 text-indigo-500" />Qaysi yil uchun</label>
                <select name="whichYear" id="whichYear" value={formData.whichYear} onChange={handleChange} className={inputBaseClass}>
                    <option value="">Yil tanlanmagan</option>
                    {getAvailableYears().map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
            </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md">Bekor qilish</button>
        <button type="submit" disabled={loading || studentsLoading || !!studentsError || !foundStudentPrimaryId || !formData.groupId} className={`px-6 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 min-w-[140px] flex items-center justify-center font-semibold text-sm shadow-md hover:shadow-lg ${loading || studentsLoading || !!studentsError || !foundStudentPrimaryId || !formData.groupId ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {loading ? <LoadingSpinner size="sm" className="text-white" /> : isEditing ? "O'zgarishlarni Saqlash" : "To'lovni Qo'shish"}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;