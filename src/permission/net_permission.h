#ifndef SRC_PERMISSION_NET_PERMISSION_H_
#define SRC_PERMISSION_NET_PERMISSION_H_

#if defined(NODE_WANT_INTERNALS) && NODE_WANT_INTERNALS

#include <unordered_map>
#include "permission/permission_base.h"

namespace node {

namespace permission {

using address_map = std::unordered_map<std::string, std::vector<std::string>>;

class NetPermission final : public PermissionBase {
 public:
  void Apply(Environment* env,
             const std::vector<std::string>& allow,
             PermissionScope scope) override;
  bool is_granted(Environment* env,
                  PermissionScope perm,
                  const std::string_view& param) const override;

 private:
  bool check_permission(const address_map* rules,
                        const std::string_view& param) const;
  void GrantAccess(PermissionScope scope, const std::string_view& param);
  void Print() const;

  address_map granted_net_udp_in_;
  address_map granted_net_udp_out_;

  bool deny_all_udp_in_ = true;
  bool deny_all_udp_out_ = true;

  bool allow_all_udp_in_ = false;
  bool allow_all_udp_out_ = false;
};

}  // namespace permission

}  // namespace node

#endif  // defined(NODE_WANT_INTERNALS) && NODE_WANT_INTERNALS
#endif  // SRC_PERMISSION_NET_PERMISSION_H_
