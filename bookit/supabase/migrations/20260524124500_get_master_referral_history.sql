-- Створення RPC-функції для отримання історії рефералів без waterfall-запитів на клієнті
CREATE OR REPLACE FUNCTION get_master_referral_history(p_referrer_id UUID)
RETURNS TABLE (
  referee_name TEXT,
  joined_at TIMESTAMPTZ,
  is_first_payment_made BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(p.full_name, 'Клієнт') AS referee_name, r.created_at AS joined_at, r.is_first_payment_made
  FROM master_referrals r
  LEFT JOIN profiles p ON p.id = r.referee_id
  WHERE r.referrer_id = p_referrer_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Надання прав доступу для автентифікованих користувачів та сервісної ролі
GRANT EXECUTE ON FUNCTION get_master_referral_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_master_referral_history(UUID) TO service_role;
